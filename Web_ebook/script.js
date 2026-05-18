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

    // --- BGM Player logic ---
    const bgmPlayer = document.getElementById('bgm-player');
    const bgmAudio = document.getElementById('bgm-audio');
    const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    const bgmPlayIcon = document.getElementById('bgm-play-icon');
    const bgmStatus = document.getElementById('bgm-status');
    const bgmMuteBtn = document.getElementById('bgm-mute-btn');
    const bgmVolumeIcon = document.getElementById('bgm-volume-icon');
    const bgmVolume = document.getElementById('bgm-volume');
    
    if (bgmPlayer && bgmAudio) {
        // Show player with a clean slide-in animation after a brief delay
        setTimeout(() => {
            bgmPlayer.classList.add('show');
        }, 800);

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

        // Try playing the audio (handles modern browser autoplay policies)
        function tryPlayAudio() {
            // First, attempt to play normally (unmuted)
            bgmAudio.play()
                .then(() => {
                    updatePlayerState(true);
                })
                .catch((error) => {
                    console.log('Unmuted autoplay blocked. Attempting muted autoplay...');
                    // Try playing muted - modern browsers allow this!
                    bgmAudio.muted = true;
                    bgmVolumeIcon.className = 'fas fa-volume-mute';
                    bgmVolume.value = 0;
                    
                    bgmAudio.play()
                        .then(() => {
                            updatePlayerState(true);
                            // Set up trigger to unmute once the user interacts with the page
                            setupUnmuteOnInteraction();
                        })
                        .catch((mutedError) => {
                            console.log('Muted autoplay also blocked. Will play on first interaction.');
                            setupPlayOnInteraction();
                        });
                });
        }

        // Toggle play/pause
        bgmToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgmAudio.paused) {
                // If it was playing muted, make sure to unmute when they click play
                if (bgmAudio.muted) {
                    bgmAudio.muted = false;
                    bgmAudio.volume = 0.5;
                    bgmVolume.value = 0.5;
                    bgmVolumeIcon.className = 'fas fa-volume-up';
                }
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

        // Setup unmute on user interaction
        const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
        
        function setupUnmuteOnInteraction() {
            function unmuteAction() {
                if (bgmAudio.muted) {
                    bgmAudio.muted = false;
                    bgmAudio.volume = 0.5;
                    bgmVolume.value = 0.5;
                    bgmVolumeIcon.className = 'fas fa-volume-up';
                }
                removeListeners(unmuteAction);
            }
            
            interactionEvents.forEach(event => {
                document.addEventListener(event, unmuteAction, { once: true, passive: true });
            });
        }
        
        function setupPlayOnInteraction() {
            function playAction() {
                if (bgmAudio.paused) {
                    bgmAudio.muted = false;
                    bgmAudio.volume = 0.5;
                    bgmVolume.value = 0.5;
                    bgmVolumeIcon.className = 'fas fa-volume-up';
                    bgmAudio.play()
                        .then(() => updatePlayerState(true))
                        .catch(err => console.log(err));
                }
                removeListeners(playAction);
            }
            
            interactionEvents.forEach(event => {
                document.addEventListener(event, playAction, { once: true, passive: true });
            });
        }

        function removeListeners(handler) {
            interactionEvents.forEach(event => {
                document.removeEventListener(event, handler);
            });
        }

        // Run autoplay attempt
        tryPlayAudio();
    }
});
