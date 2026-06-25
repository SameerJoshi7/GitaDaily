import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import type { Shloka } from './ShlokaCard';

interface ShlokaShareProps {
  shloka: Shloka;
  customCounsel?: {
    modernCounsel: string;
    wellbeingInsight: string;
    actionStep: string;
  };
}

/**
 * Converts an image URL to a base64 data URL by loading it into a canvas.
 * This guarantees the image is fully embedded and available for html-to-image.
 */
const imgToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

// SVG icons as inline strings (no React rendering needed for the offscreen DOM)
const BRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>`;
const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
const SPARKLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`;

export const ShlokaShare: React.FC<ShlokaShareProps> = ({ shloka, customCounsel }) => {
  const [isSharing, setIsSharing] = useState(false);

  const artworks = [
    '/images/chariot.jpg',
    '/images/discourse.jpg',
    '/images/vishwaroopa.jpg'
  ];
  const activeArtwork = artworks[(shloka.chapter + shloka.verse) % artworks.length];
  const hasAI = customCounsel || shloka.reflection;

  const handleShare = async () => {
    try {
      setIsSharing(true);

      // 1. Pre-load ALL images as base64 BEFORE building the DOM
      const [bgBase64, logoBase64] = await Promise.all([
        imgToBase64(activeArtwork),
        imgToBase64('/flute-icon.png')
      ]);

      // 2. Build the entire share card as a raw DOM element (no React rendering race)
      const container = document.createElement('div');
      container.style.cssText = `
        width: 1080px; height: 1350px; background-color: #0a0b10;
        position: relative; display: flex; flex-direction: column;
        align-items: center; box-sizing: border-box; overflow: hidden;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      `;

      // -- Background image (base64 embedded)
      if (bgBase64) {
        const bgImg = document.createElement('img');
        bgImg.src = bgBase64;
        bgImg.style.cssText = `
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: 0.2; z-index: 0;
        `;
        container.appendChild(bgImg);
      }

      // -- Gradient overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(to bottom, rgba(10,11,16,0.4) 0%, rgba(10,11,16,0.85) 100%);
        z-index: 0;
      `;
      container.appendChild(overlay);

      // -- Decorative gold border
      const border = document.createElement('div');
      border.style.cssText = `
        position: absolute; top: 28px; left: 28px; right: 28px; bottom: 28px;
        border: 2px solid rgba(212, 175, 55, 0.4); z-index: 1; pointer-events: none;
      `;
      // Corner dots
      const corners = [
        { top: '-5px', left: '-5px' },
        { top: '-5px', right: '-5px' },
        { bottom: '-5px', left: '-5px' },
        { bottom: '-5px', right: '-5px' }
      ];
      corners.forEach(pos => {
        const dot = document.createElement('div');
        dot.style.cssText = `
          position: absolute; width: 10px; height: 10px; border-radius: 50%;
          background: #d4af37;
          ${pos.top ? `top: ${pos.top};` : ''}
          ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
          ${pos.left ? `left: ${pos.left};` : ''}
          ${pos.right ? `right: ${pos.right};` : ''}
        `;
        border.appendChild(dot);
      });
      container.appendChild(border);

      // -- Content wrapper
      const content = document.createElement('div');
      content.style.cssText = `
        position: relative; z-index: 2; display: flex; flex-direction: column;
        align-items: center; width: 100%; height: 100%;
        padding: 48px 56px;
        box-sizing: border-box;
      `;

      // ── Header: Logo + App Name ──
      const header = document.createElement('div');
      header.style.cssText = `display: flex; flex-direction: column; align-items: center; margin-bottom: 28px;`;
      
      const logoRow = document.createElement('div');
      logoRow.style.cssText = `display: flex; align-items: center; gap: 14px; margin-bottom: 6px;`;
      if (logoBase64) {
        const logo = document.createElement('img');
        logo.src = logoBase64;
        logo.style.cssText = `width: 44px; height: 44px;`;
        logoRow.appendChild(logo);
      }
      const appName = document.createElement('span');
      appName.style.cssText = `font-size: 36px; font-weight: 700; color: #d4af37; font-family: 'Tiro Devanagari Sanskrit', serif;`;
      appName.textContent = 'कृष्णबोध';
      logoRow.appendChild(appName);
      header.appendChild(logoRow);
      
      const subName = document.createElement('span');
      subName.style.cssText = `font-size: 14px; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 4px; font-family: 'Inter', sans-serif;`;
      subName.textContent = 'KRISHNA BODHA';
      header.appendChild(subName);
      content.appendChild(header);

      // ── Chapter / Verse badge ──
      const badge = document.createElement('div');
      badge.style.cssText = `
        display: flex; align-items: center; gap: 12px;
        padding: 8px 28px; border-top: 1px solid #d4af37; border-bottom: 1px solid #d4af37;
        margin-bottom: 32px;
      `;
      badge.innerHTML = `${SPARKLE_SVG}<span style="font-family:'Inter',sans-serif; color:#d4af37; font-size:16px; letter-spacing:4px; text-transform:uppercase;">CHAPTER ${shloka.chapter}, VERSE ${shloka.verse}</span>${SPARKLE_SVG}`;
      content.appendChild(badge);

      // ── Sanskrit ──
      const sanskritBlock = document.createElement('div');
      sanskritBlock.style.cssText = `text-align: center; margin-bottom: 24px; width: 92%;`;
      const sanskritText = document.createElement('div');
      sanskritText.style.cssText = `
        font-family: 'Tiro Devanagari Sanskrit', serif; font-size: 34px; color: #ffffff;
        font-weight: 600; line-height: 1.55; margin-bottom: 12px; white-space: pre-line;
        text-shadow: 0 3px 10px rgba(0,0,0,0.7);
      `;
      sanskritText.textContent = shloka.sanskrit;
      sanskritBlock.appendChild(sanskritText);

      const translit = document.createElement('div');
      translit.style.cssText = `font-style: italic; color: rgba(255,255,255,0.75); font-size: 18px; text-shadow: 0 2px 6px rgba(0,0,0,0.7); line-height: 1.5;`;
      translit.textContent = shloka.reflection?.translatedTransliteration || shloka.transliteration;
      sanskritBlock.appendChild(translit);
      content.appendChild(sanskritBlock);

      // ── Translation Box ──
      const translationBox = document.createElement('div');
      translationBox.style.cssText = `
        width: 92%; background: rgba(18,20,31,0.7); border: 1px solid rgba(212,175,55,0.3);
        border-radius: 16px; padding: 28px 24px; margin-bottom: 28px;
        text-align: center; position: relative;
      `;
      const translationLabel = document.createElement('div');
      translationLabel.style.cssText = `
        position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
        background: #0a0b10; padding: 0 14px; color: #d4af37;
        font-family: 'Inter', sans-serif; font-size: 14px; letter-spacing: 3px;
      `;
      translationLabel.textContent = 'TRANSLATION';
      translationBox.appendChild(translationLabel);
      const translationText = document.createElement('p');
      translationText.style.cssText = `color: #ffffff; font-size: 20px; line-height: 1.55; margin: 0;`;
      translationText.textContent = shloka.reflection?.translatedTranslation || shloka.translation;
      translationBox.appendChild(translationText);
      content.appendChild(translationBox);

      // ── AI Sections ──
      if (hasAI) {
        const aiContainer = document.createElement('div');
        aiContainer.style.cssText = `display: flex; flex-direction: column; gap: 14px; width: 92%;`;

        const sections = [
          {
            icon: BRAIN_SVG,
            color: '#d4af37',
            bgColor: 'rgba(212,175,55,0.08)',
            title: customCounsel ? 'PERSONALIZED COUNSEL' : 'AI DEEP UNDERSTANDING',
            text: customCounsel ? customCounsel.modernCounsel : shloka.reflection?.modernReflection || '',
          },
          {
            icon: HEART_SVG,
            color: '#a855f7',
            bgColor: 'rgba(168,85,247,0.08)',
            title: 'EMOTIONAL WELL-BEING',
            text: customCounsel ? customCounsel.wellbeingInsight : shloka.reflection?.emotionalWellbeing || '',
          },
          {
            icon: '🧘',
            color: '#22c55e',
            bgColor: 'rgba(34,197,94,0.08)',
            title: customCounsel ? 'ACTIONABLE STEP' : 'MINDFUL PRACTICE FOR TODAY',
            text: customCounsel ? customCounsel.actionStep : shloka.reflection?.mindfulnessTip || '',
            italic: true,
          }
        ];

        sections.forEach(s => {
          const row = document.createElement('div');
          row.style.cssText = `
            display: flex; gap: 16px; background: linear-gradient(90deg, ${s.bgColor}, transparent);
            border-left: 3px solid ${s.color}; padding: 16px 18px; border-radius: 0 12px 12px 0;
          `;
          const iconEl = document.createElement('div');
          iconEl.style.cssText = `flex-shrink: 0; display: flex; align-items: flex-start; padding-top: 2px;`;
          if (s.icon.startsWith('<svg')) {
            iconEl.innerHTML = s.icon;
          } else {
            iconEl.style.cssText += `font-size: 28px;`;
            iconEl.textContent = s.icon;
          }
          row.appendChild(iconEl);

          const textCol = document.createElement('div');
          textCol.style.cssText = `display: flex; flex-direction: column; gap: 4px;`;
          const title = document.createElement('span');
          title.style.cssText = `color: ${s.color}; font-family: 'Inter', sans-serif; font-size: 14px; letter-spacing: 1.5px; font-weight: 600;`;
          title.textContent = s.title;
          textCol.appendChild(title);
          const body = document.createElement('span');
          body.style.cssText = `color: #e5e7eb; font-size: 17px; line-height: 1.45; ${s.italic ? 'font-style: italic;' : ''}`;
          body.textContent = s.italic ? `"${s.text}"` : s.text;
          textCol.appendChild(body);
          row.appendChild(textCol);
          aiContainer.appendChild(row);
        });

        content.appendChild(aiContainer);
      }

      // ── Footer ──
      const footer = document.createElement('div');
      footer.style.cssText = `margin-top: auto; padding-top: 16px; text-align: center; width: 100%;`;
      const footerText = document.createElement('span');
      footerText.style.cssText = `font-size: 16px; color: rgba(255,255,255,0.55); font-style: italic;`;
      footerText.textContent = 'with ❤️ by Sameer Joshi';
      footer.appendChild(footerText);
      content.appendChild(footer);

      container.appendChild(content);

      // 3. Append offscreen, capture, then remove
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-9999px';
      container.style.zIndex = '-1000';
      document.body.appendChild(container);

      // Wait for images to paint
      await new Promise(res => setTimeout(res, 200));

      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(container, {
        quality: 1.0,
        pixelRatio: 1,
        backgroundColor: '#0a0b10',
      });

      // Cleanup
      document.body.removeChild(container);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `gita-ch${shloka.chapter}-v${shloka.verse}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Krishna Bodha - Ch ${shloka.chapter}, Verse ${shloka.verse}`,
          text: 'Daily wisdom and reflection from Krishna Bodha.',
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to share image', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="bookmark-icon-btn"
      title="Share as Image"
      aria-label="Share as Image"
      disabled={isSharing}
      style={{ opacity: isSharing ? 0.5 : 1 }}
    >
      <Share2 size={22} />
    </button>
  );
};
