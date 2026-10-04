/* ============================================
   Império Clinic - Instagram Filter Script
   ============================================ */

(function () {
    'use strict';

    // ── DOM Elements ──
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');
    const dateText = document.getElementById('date-text');
    const timeText = document.getElementById('time-text');
    const btnFlip = document.getElementById('btn-flip');
    const btnCapture = document.getElementById('btn-capture');
    const btnDownload = document.getElementById('btn-download');
    const flashOverlay = document.getElementById('flash-overlay');
    const previewModal = document.getElementById('preview-modal');
    const previewImg = document.getElementById('preview-img');
    const btnPreviewClose = document.getElementById('btn-preview-close');
    const btnPreviewDownload = document.getElementById('btn-preview-download');
    const permissionPrompt = document.getElementById('permission-prompt');
    const btnAllowCamera = document.getElementById('btn-allow-camera');
    const logoImg = document.getElementById('logo-img');

    // ── State ──
    let currentFacingMode = 'user'; // front camera by default
    let currentStream = null;
    let lastCapturedBlob = null;

    // ── Portuguese Month Names ──
    const mesesPTBR = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const diasSemanaPTBR = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    // ── Date/Time Formatting ──
    function updateDateTime() {
        const now = new Date();

        const dia = now.getDate().toString().padStart(2, '0');
        const mes = mesesPTBR[now.getMonth()];
        const ano = now.getFullYear();
        const diaSemana = diasSemanaPTBR[now.getDay()];

        dateText.textContent = `${dia} de ${mes}, ${ano}`;

        const horas = now.getHours().toString().padStart(2, '0');
        const minutos = now.getMinutes().toString().padStart(2, '0');
        timeText.textContent = `${horas}:${minutos}`;
    }

    // Update every second
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ── Camera ──
    async function startCamera(facingMode) {
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1080 },
                    height: { ideal: 1920 },
                    aspectRatio: { ideal: 9 / 16 }
                },
                audio: false
            };

            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = currentStream;
            await video.play();

            // Mirror front camera
            video.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';

            permissionPrompt.classList.add('hidden');
        } catch (err) {
            console.error('Camera error:', err);
            alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        }
    }

    // ── Flip Camera ──
    btnFlip.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        startCamera(currentFacingMode);
    });

    // ── Capture Photo ──
    btnCapture.addEventListener('click', async () => {
        if (!currentStream) return;

        // Flash effect
        flashOverlay.classList.add('flash');
        setTimeout(() => flashOverlay.classList.remove('flash'), 400);

        // Set canvas to video dimensions for high quality
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        canvas.width = vw;
        canvas.height = vh;

        // Draw the video frame (mirror if front camera)
        ctx.save();
        if (currentFacingMode === 'user') {
            ctx.translate(vw, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, vw, vh);
        ctx.restore();

        // Draw logo on top
        await drawLogoOnCanvas(vw, vh);

        // Draw date/time on bottom
        drawDateTimeOnCanvas(vw, vh);

        // Convert to blob
        canvas.toBlob((blob) => {
            lastCapturedBlob = blob;
            const url = URL.createObjectURL(blob);
            previewImg.src = url;
            previewModal.classList.remove('hidden');
            btnDownload.disabled = false;
        }, 'image/jpeg', 0.95);
    });

    // ── Draw Logo on Canvas ──
    function drawLogoOnCanvas(cw, ch) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const logoWidth = cw * 0.4;
                const ratio = img.height / img.width;
                const logoHeight = logoWidth * ratio;
                const x = (cw - logoWidth) / 2;
                const y = ch * 0.06;

                // Draw gradient backdrop for logo
                const grad = ctx.createLinearGradient(0, 0, 0, y + logoHeight + ch * 0.04);
                grad.addColorStop(0, 'rgba(0,0,0,0.45)');
                grad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, cw, y + logoHeight + ch * 0.04);

                // Draw shadow
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 3;
                ctx.drawImage(img, x, y, logoWidth, logoHeight);
                ctx.shadowColor = 'transparent';

                resolve();
            };
            img.onerror = () => resolve();
            img.src = logoImg.src;
        });
    }

    // ── Draw DateTime on Canvas ──
    function drawDateTimeOnCanvas(cw, ch) {
        const now = new Date();
        const dia = now.getDate().toString().padStart(2, '0');
        const mes = mesesPTBR[now.getMonth()];
        const ano = now.getFullYear();
        const horas = now.getHours().toString().padStart(2, '0');
        const minutos = now.getMinutes().toString().padStart(2, '0');

        const dateStr = `${dia} de ${mes}, ${ano}`;
        const timeStr = `${horas}:${minutos}`;

        // Gradient background at bottom
        const gradH = ch * 0.25;
        const gradY = ch - gradH;
        const grad = ctx.createLinearGradient(0, ch, 0, gradY);
        grad.addColorStop(0, 'rgba(0,0,0,0.5)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, gradY, cw, gradH);

        // Date text
        const dateFontSize = Math.round(cw * 0.035);
        ctx.font = `400 ${dateFontSize}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow for text
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#d4a44a';
        const dateY = ch - ch * 0.18;
        ctx.fillText(dateStr, cw / 2, dateY);

        // Time text
        const timeFontSize = Math.round(cw * 0.12);
        ctx.font = `700 ${timeFontSize}px 'Outfit', sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.letterSpacing = '3px';
        const timeY = dateY + timeFontSize * 0.75;
        ctx.fillText(timeStr, cw / 2, timeY);

        // "Sua Vez" badge pill
        ctx.shadowColor = 'transparent';
        const badgeText = 'SUA VEZ';
        const badgeFontSize = Math.round(cw * 0.028);
        ctx.font = `600 ${badgeFontSize}px 'Outfit', sans-serif`;
        const badgeMetrics = ctx.measureText(badgeText);
        const badgePadX = cw * 0.035;
        const badgePadY = cw * 0.015;
        const badgeW = badgeMetrics.width + badgePadX * 2;
        const badgeH = badgeFontSize + badgePadY * 2;
        const badgeX = (cw - badgeW) / 2;
        const badgeY = timeY + timeFontSize * 0.35;
        const badgeR = badgeH / 2;

        // Draw pill background
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw badge text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, cw / 2, badgeY + badgeH / 2);

        ctx.shadowColor = 'transparent';
    }

    // ── Preview Modal ──
    btnPreviewClose.addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });

    btnPreviewDownload.addEventListener('click', () => {
        downloadPhoto();
    });

    btnDownload.addEventListener('click', () => {
        downloadPhoto();
    });

    function downloadPhoto() {
        if (!lastCapturedBlob) return;

        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const filename = `imperio_clinic_${timestamp}.jpg`;

        const url = URL.createObjectURL(lastCapturedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Permission Button ──
    btnAllowCamera.addEventListener('click', () => {
        startCamera(currentFacingMode);
    });

    // ── Auto-start if permissions already granted ──
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' }).then((result) => {
            if (result.state === 'granted') {
                startCamera(currentFacingMode);
            }
        }).catch(() => {
            // permissions API not fully supported, user must click
        });
    }
})();
