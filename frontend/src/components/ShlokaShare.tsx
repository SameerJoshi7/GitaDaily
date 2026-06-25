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

// ── Helpers ──

/** Load an image and return it as an HTMLImageElement */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Wrap text to fit within maxWidth, returning lines */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
};


// ── Component ──


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

      const W = 1080;
      const H = 1350;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // ── 1. Dark background ──
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(0, 0, W, H);

      // ── 2. Background artwork with low opacity ──
      try {
        const bgImg = await loadImage(activeArtwork);
        ctx.globalAlpha = 0.2;
        // Cover the canvas (crop to fit)
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const sw = W / scale;
        const sh = H / scale;
        const sx = (bgImg.width - sw) / 2;
        const sy = (bgImg.height - sh) / 2;
        ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, W, H);
        ctx.globalAlpha = 1.0;
      } catch {
        // Gracefully skip if image fails to load
        ctx.globalAlpha = 1.0;
      }

      // ── 3. Gradient overlay ──
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(10,11,16,0.4)');
      grad.addColorStop(1, 'rgba(10,11,16,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── 4. Decorative gold border ──
      const borderInset = 30;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(borderInset, borderInset, W - borderInset * 2, H - borderInset * 2);

      // Corner dots
      ctx.fillStyle = '#d4af37';
      const dotR = 6;
      [
        [borderInset, borderInset],
        [W - borderInset, borderInset],
        [borderInset, H - borderInset],
        [W - borderInset, H - borderInset]
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Layout constants ──
      const pad = 72; // horizontal content padding
      const contentW = W - pad * 2;
      let y = 60; // current drawing Y cursor

      // ── 5. Header: Logo + App Name ──
      try {
        const logo = await loadImage('/flute-icon.png');
        ctx.drawImage(logo, W / 2 - 100, y, 46, 46);
      } catch {
        // Skip logo if it fails
      }
      ctx.fillStyle = '#d4af37';
      ctx.font = '700 40px "Tiro Devanagari Sanskrit", serif';
      ctx.textAlign = 'left';
      ctx.fillText('कृष्णबोध', W / 2 - 44, y + 36);
      y += 56;

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 14px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KRISHNA BODHA', W / 2, y);
      y += 40;

      // ── 6. Chapter / Verse badge ──
      const badgeText = `✦  CHAPTER ${shloka.chapter}, VERSE ${shloka.verse}  ✦`;
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      const badgeW = 380;
      const badgeX = (W - badgeW) / 2;
      // Top line
      ctx.beginPath();
      ctx.moveTo(badgeX, y);
      ctx.lineTo(badgeX + badgeW, y);
      ctx.stroke();
      y += 30;
      ctx.fillStyle = '#d4af37';
      ctx.font = '600 16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, W / 2, y);
      y += 20;
      // Bottom line
      ctx.beginPath();
      ctx.moveTo(badgeX, y);
      ctx.lineTo(badgeX + badgeW, y);
      ctx.stroke();
      y += 40;

      // ── 7. Sanskrit text ──
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 40px "Tiro Devanagari Sanskrit", serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 12;
      const sanskritLines = shloka.sanskrit.split('\n');
      sanskritLines.forEach((line) => {
        const subLines = wrapText(ctx, line.trim(), contentW);
        subLines.forEach((sl) => {
          ctx.fillText(sl, W / 2, y);
          y += 58;
        });
      });
      ctx.shadowBlur = 0;
      y += 12;

      // ── 8. Transliteration ──
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'italic 20px "Inter", sans-serif';
      ctx.textAlign = 'center';
      const translitText = shloka.reflection?.translatedTransliteration || shloka.transliteration;
      const translitLines = wrapText(ctx, translitText, contentW - 20);
      translitLines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 30;
      });
      y += 30;

      // ── 9. Translation box ──
      const boxPadX = 32;
      const boxPadY = 32;
      const boxX = pad;
      const boxY = y;
      const translationText = shloka.reflection?.translatedTranslation || shloka.translation;

      // Measure how tall the translation text will be
      ctx.font = '400 22px "Inter", sans-serif';
      const transLines = wrapText(ctx, translationText, contentW - boxPadX * 2);
      const transTextHeight = transLines.length * 34;
      const boxH = transTextHeight + boxPadY * 2;

      // Draw box background
      const boxRadius = 16;
      ctx.fillStyle = 'rgba(18, 20, 31, 0.7)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, contentW, boxH, boxRadius);
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // "TRANSLATION" label
      const labelText = 'TRANSLATION';
      ctx.font = '600 13px "Inter", sans-serif';
      const labelW = ctx.measureText(labelText).width + 28;
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(W / 2 - labelW / 2, boxY - 10, labelW, 20);
      ctx.fillStyle = '#d4af37';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, W / 2, boxY + 5);

      // Translation text
      ctx.fillStyle = '#ffffff';
      ctx.font = '400 22px "Inter", sans-serif';
      ctx.textAlign = 'center';
      let transY = boxY + boxPadY + 24;
      transLines.forEach((line) => {
        ctx.fillText(line, W / 2, transY);
        transY += 34;
      });
      y = boxY + boxH + 30;

      // ── 10. AI Sections ──
      // Calculate remaining space to distribute evenly
      const footerHeight = 50;
      const remainingH = H - y - footerHeight - 30; // 30px bottom margin
      
      if (hasAI) {
        const sections = [
          {
            color: '#d4af37',
            bgColor: 'rgba(212, 175, 55, 0.1)',
            title: customCounsel ? 'PERSONALIZED COUNSEL' : 'AI DEEP UNDERSTANDING',
            text: customCounsel ? customCounsel.modernCounsel : shloka.reflection?.modernReflection || '',
            emoji: '🧠',
          },
          {
            color: '#a855f7',
            bgColor: 'rgba(168, 85, 247, 0.1)',
            title: 'EMOTIONAL WELL-BEING',
            text: customCounsel ? customCounsel.wellbeingInsight : shloka.reflection?.emotionalWellbeing || '',
            emoji: '💜',
          },
          {
            color: '#22c55e',
            bgColor: 'rgba(34, 197, 94, 0.1)',
            title: customCounsel ? 'ACTIONABLE STEP' : 'MINDFUL PRACTICE',
            text: customCounsel ? customCounsel.actionStep : shloka.reflection?.mindfulnessTip || '',
            emoji: '🧘',
            italic: true,
          }
        ];

        // First pass: measure total AI content height
        let totalAIHeight = 0;
        const sectionHeights: number[] = [];
        for (const s of sections) {
          ctx.font = `${s.italic ? 'italic ' : ''}19px "Inter", sans-serif`;
          const bodyText = s.italic ? `"${s.text}"` : s.text;
          const bodyLines = wrapText(ctx, bodyText, contentW - 72);
          const bodyH = bodyLines.length * 29;
          const sH = Math.max(bodyH + 56, 80);
          sectionHeights.push(sH);
          totalAIHeight += sH;
        }
        // Calculate gap between sections to fill remaining space
        const sectionGap = Math.max(16, Math.min(28, (remainingH - totalAIHeight) / (sections.length + 1)));
        y += sectionGap / 2;

        for (let i = 0; i < sections.length; i++) {
          const s = sections[i];
          const sectionX = pad;
          const sectionW = contentW;

          ctx.font = `${s.italic ? 'italic ' : ''}19px "Inter", sans-serif`;
          const bodyText = s.italic ? `"${s.text}"` : s.text;
          const bodyLines = wrapText(ctx, bodyText, sectionW - 72);
          const sectionH = sectionHeights[i];
          const sRadius = 12;

          // Background
          ctx.fillStyle = s.bgColor;
          ctx.beginPath();
          ctx.roundRect(sectionX, y, sectionW, sectionH, [0, sRadius, sRadius, 0]);
          ctx.fill();

          // Left accent bar
          ctx.fillStyle = s.color;
          ctx.fillRect(sectionX, y, 4, sectionH);

          // Emoji icon
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(s.emoji, sectionX + 18, y + 34);

          // Title
          ctx.fillStyle = s.color;
          ctx.font = '700 14px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(s.title, sectionX + 58, y + 30);

          // Body text
          ctx.fillStyle = '#e5e7eb';
          ctx.font = `${s.italic ? 'italic ' : ''}19px "Inter", sans-serif`;
          let bodyY = y + 54;
          bodyLines.forEach((line) => {
            ctx.fillText(line, sectionX + 58, bodyY);
            bodyY += 29;
          });

          y += sectionH + sectionGap;
        }
      }

      // ── 11. Footer ──
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'italic 16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('with ❤️ by Sameer Joshi', W / 2, H - 42);

      // ── 12. Export as PNG ──
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `gita-ch${shloka.chapter}-v${shloka.verse}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Krishna Bodha - Ch ${shloka.chapter}, Verse ${shloka.verse}`,
          text: 'Daily wisdom from Krishna Bodha.',
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
