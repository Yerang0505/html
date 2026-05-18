document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const revealElements = document.querySelectorAll('.reveal');

    // Navigation Background Change on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Reveal Animation
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));

    // Smooth Scroll for Navigation Links (if they refer to IDs)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Welcome Overlay & BGM Autoplay Logic ---
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const welcomeEnterBtn = document.getElementById('welcome-enter-btn');
    const bgmPlayer = document.getElementById('bgm-player');
    const bgmAudio = document.getElementById('bgm-audio');
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const bgmPlayIcon = document.getElementById('bgm-play-icon');
    const bgmStatus = document.getElementById('bgm-status');
    const bgmMuteBtn = document.getElementById('bgm-mute-btn');
    const bgmVolumeIcon = document.getElementById('bgm-volume-icon');
    const bgmVolume = document.getElementById('bgm-volume');
    
    if (bgmAudio) {
        // Set initial volume
        bgmAudio.volume = 0.5;
        bgmVolume.value = 0.5;

        // Function to update UI based on playing state
        function updatePlayerState(isPlaying) {
            if (isPlaying) {
                bgmPlayer.classList.add('playing');
                bgmPlayIcon.className = 'fas fa-pause';
                bgmStatus.textContent = 'BGM 재생 중';
            } else {
                bgmPlayer.classList.remove('playing');
                bgmPlayIcon.className = 'fas fa-play';
                bgmStatus.textContent = 'BGM 일시정지';
            }
        }

        // Try standard autoplay first (just in case browser allows it)
        bgmAudio.play()
            .then(() => {
                updatePlayerState(true);
                // If autoplay worked and session active, hide welcome screen immediately
                if (sessionStorage.getItem('bgm_activated') === 'true') {
                    if (welcomeOverlay) welcomeOverlay.style.display = 'none';
                    if (bgmPlayer) bgmPlayer.classList.add('show');
                }
            })
            .catch(() => {
                console.log('Autoplay blocked. Awaiting user interaction via welcome overlay.');
                updatePlayerState(false);
                if (sessionStorage.getItem('bgm_activated') === 'true') {
                    // If they already clicked enter in this session, try to play on any scroll/click
                    setupPlayOnInteraction();
                }
            });

        // Click event for the Welcome Enter button - counts as user gesture!
        if (welcomeEnterBtn && welcomeOverlay) {
            // If already activated in session, hide overlay immediately
            if (sessionStorage.getItem('bgm_activated') === 'true') {
                welcomeOverlay.style.display = 'none';
                if (bgmPlayer) {
                    setTimeout(() => {
                        bgmPlayer.classList.add('show');
                    }, 500);
                }
            } else {
                welcomeEnterBtn.addEventListener('click', () => {
                    welcomeOverlay.classList.add('fade-out');
                    sessionStorage.setItem('bgm_activated', 'true');
                    
                    // Show BGM Player widget with clean animation
                    setTimeout(() => {
                        bgmPlayer.classList.add('show');
                    }, 800);

                    // Play audio unmuted immediately!
                    bgmAudio.muted = false;
                    bgmAudio.volume = 0.5;
                    bgmVolume.value = 0.5;
                    if (bgmVolumeIcon) bgmVolumeIcon.className = 'fas fa-volume-up';
                    
                    bgmAudio.play()
                        .then(() => updatePlayerState(true))
                        .catch(err => {
                            console.error('Play failed even after click:', err);
                            setupPlayOnInteraction();
                        });
                });
            }
        }

        // Toggle play/pause
        bgmToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgmAudio.paused) {
                bgmAudio.play()
                    .then(() => updatePlayerState(true))
                    .catch(err => console.error(err));
            } else {
                bgmAudio.pause();
                updatePlayerState(false);
            }
        });

        // Volume Change
        bgmVolume.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            bgmAudio.volume = vol;
            if (vol === 0) {
                bgmVolumeIcon.className = 'fas fa-volume-mute';
                bgmAudio.muted = true;
            } else {
                bgmAudio.muted = false;
                if (vol < 0.4) {
                    bgmVolumeIcon.className = 'fas fa-volume-down';
                } else {
                    bgmVolumeIcon.className = 'fas fa-volume-up';
                }
            }
        });

        // Mute/Unmute Toggle
        let lastVolume = 0.5;
        bgmMuteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgmAudio.muted) {
                bgmAudio.muted = false;
                bgmVolume.value = lastVolume;
                bgmAudio.volume = lastVolume;
                if (lastVolume < 0.4) {
                    bgmVolumeIcon.className = 'fas fa-volume-down';
                } else {
                    bgmVolumeIcon.className = 'fas fa-volume-up';
                }
            } else {
                lastVolume = bgmAudio.volume > 0 ? bgmAudio.volume : 0.5;
                bgmAudio.muted = true;
                bgmVolume.value = 0;
                bgmAudio.volume = 0;
                bgmVolumeIcon.className = 'fas fa-volume-mute';
            }
        });

        // Fallback: play on first user interaction anywhere
        function setupPlayOnInteraction() {
            const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
            function playAction() {
                if (bgmAudio.paused) {
                    bgmAudio.play()
                        .then(() => updatePlayerState(true))
                        .catch(err => console.log(err));
                }
                interactionEvents.forEach(event => {
                    document.removeEventListener(event, playAction);
                });
            }
            interactionEvents.forEach(event => {
                document.addEventListener(event, playAction, { once: true, passive: true });
            });
        }
    }
});
