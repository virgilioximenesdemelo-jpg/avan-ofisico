/**
 * SCLAF — Utilitários de Exportação e Higienização de PDF (html2canvas + jsPDF)
 * Garante captura nítida com preservação total de estilos, fontes e cores.
 */

/**
 * Converte qualquer representação de cor oklch para rgb padrão
 * usando a API nativa do Canvas do navegador.
 */
export function convertOklchToRgb(colorStr: string): string {
  try {
    if (typeof document === 'undefined') return '#64748b';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '#64748b';
    ctx.fillStyle = colorStr;
    return ctx.fillStyle || '#64748b';
  } catch {
    return '#64748b';
  }
}

/**
 * Higieniza o Document clonado antes da renderização do html2canvas.
 * Garante que o elemento clonado esteja visível, com dimensões explícitas,
 * sem propriedades conflitantes e converte funções de cores modernas (como oklch)
 * para formatos suportados como rgb/hex.
 */
export function cleanClonedDocForPdfExport(clonedDoc: Document, clonedEl?: HTMLElement) {
  if (!clonedDoc) return;

  // 1. Sanitizar qualquer regra com oklch em tags <style> no clone do documento
  try {
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach((styleTag) => {
      if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
        styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/gi, (match) => {
          return convertOklchToRgb(match);
        });
      }
    });
  } catch (err) {
    console.warn('Aviso ao sanitizar oklch em <style> tags:', err);
  }

  if (clonedEl) {
    clonedEl.style.position = 'relative';
    clonedEl.style.left = '0px';
    clonedEl.style.top = '0px';
    clonedEl.style.transform = 'none';
    clonedEl.style.visibility = 'visible';
    clonedEl.style.opacity = '1';
    clonedEl.style.display = 'block';
    clonedEl.style.width = '1440px';
    clonedEl.style.maxWidth = '1440px';
    clonedEl.style.minWidth = '1440px';
    clonedEl.style.height = '1018px';
    clonedEl.style.maxHeight = '1018px';
    clonedEl.style.minHeight = '1018px';
    clonedEl.style.margin = '0px';
    clonedEl.style.padding = '0px';
    clonedEl.style.boxSizing = 'border-box';
    clonedEl.style.backgroundColor = '#ffffff';

    // Higienizar atributos de estilo inline com oklch dentro do elemento clonado
    try {
      const styledElements = clonedEl.querySelectorAll<HTMLElement>('[style]');
      styledElements.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && styleAttr.includes('oklch')) {
          el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/gi, (match) => {
            return convertOklchToRgb(match);
          }));
        }
      });
    } catch (err) {
      console.warn('Aviso ao sanitizar oklch em atributos inline:', err);
    }

    // Higienizar toda a árvore de ancestrais para evitar sobreposição ou corte pelo html2canvas
    let parent = clonedEl.parentElement;
    while (parent && parent !== clonedDoc.body && parent !== clonedDoc.documentElement) {
      parent.style.visibility = 'visible';
      parent.style.opacity = '1';
      parent.style.zIndex = '1';
      parent.style.overflow = 'visible';
      parent = parent.parentElement;
    }
  }

  // Ocultar elementos marcados para não-impressão no clone
  const hiddenElements = clonedDoc.querySelectorAll<HTMLElement>('.no-print, .print\\:hidden');
  hiddenElements.forEach((el) => {
    el.style.display = 'none';
  });

  // Garantir dimensões explícitas para todos os SVGs
  const svgs = clonedDoc.querySelectorAll('svg');
  svgs.forEach((svg) => {
    try {
      const rect = svg.getBoundingClientRect();
      const w = Math.max(12, Math.round(rect.width || parseFloat(svg.getAttribute('width') || '16') || 16));
      const h = Math.max(12, Math.round(rect.height || parseFloat(svg.getAttribute('height') || '16') || 16));
      svg.setAttribute('width', `${w}`);
      svg.setAttribute('height', `${h}`);
      svg.style.width = `${w}px`;
      svg.style.height = `${h}px`;
    } catch (e) {}
  });

  // Garantir crossOrigin em imagens
  const images = clonedDoc.querySelectorAll('img');
  images.forEach((img) => {
    try {
      img.crossOrigin = 'anonymous';
    } catch (e) {}
  });
}

/**
 * Instala proteção para CanvasRenderingContext2D.prototype.createPattern e retorna função de restauração.
 */
export function installCanvasPatternSafeguard(): () => void {
  if (typeof window === 'undefined') return () => {};

  const originalCreatePattern = CanvasRenderingContext2D.prototype.createPattern;

  try {
    CanvasRenderingContext2D.prototype.createPattern = function (
      image: CanvasImageSource,
      repetition: string | null
    ): CanvasPattern | null {
      try {
        if (!image) return null;
        const w = (image as any).width || (image as any).videoWidth || (image as any).naturalWidth;
        const h = (image as any).height || (image as any).videoHeight || (image as any).naturalHeight;

        if (w === 0 || h === 0) {
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = 1;
          fallbackCanvas.height = 1;
          const ctx = fallbackCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1, 1);
          }
          return originalCreatePattern.call(this, fallbackCanvas, repetition || 'repeat');
        }

        return originalCreatePattern.call(this, image, repetition || 'repeat');
      } catch (err) {
        console.warn('Canvas pattern safe fallback acionado:', err);
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 1;
        fallbackCanvas.height = 1;
        return originalCreatePattern.call(this, fallbackCanvas, 'repeat');
      }
    };
  } catch (e) {}

  return () => {
    try {
      CanvasRenderingContext2D.prototype.createPattern = originalCreatePattern;
    } catch (e) {}
  };
}
