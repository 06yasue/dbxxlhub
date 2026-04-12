        document.addEventListener('DOMContentLoaded', function() {
            
            const API_KEY = 'bd1a50d2bfe48e2e5530bbf7201c8afd';
            const BASE_URL = 'https://api.themoviedb.org/3';
            const IMG_URL = 'https://image.tmdb.org/t/p/w500';
            const IMG_BG_URL = 'https://image.tmdb.org/t/p/w1280';
            
            const FALLBACK_POSTER = '/no-poster.png';   
            const FALLBACK_BACKDROP = '/no-backdrop.png'; 
            
            const homeView = document.getElementById('home-view');
            const playerView = document.getElementById('player-view');
            const error404View = document.getElementById('error-404');
            const movieGrid = document.getElementById('movie-grid');
            const relatedGrid = document.getElementById('related-grid');
            const loadingSpinner = document.getElementById('loading-spinner');
            
            let currentPage = 1;
            let isFetching = false;
            let durasiTMDB = 0; 
            let gateTriggered = false; 
            let hasStarted = false; // Penanda untuk menampilkan progress bar hanya setelah play diklik

            const urlParams = new URLSearchParams(window.location.search);
            const movieId = urlParams.get('id');

            function slugify(text) {
                return text.toString().toLowerCase()
                    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
            }

            if (movieId) {
                homeView.style.display = 'none';
                fetchMovieDetails(movieId);
            } else {
                playerView.style.display = 'none';
                homeView.style.display = 'block';
                fetchKoreanMovies(currentPage);
                
                window.addEventListener('scroll', () => {
                    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
                        if (!isFetching) {
                            currentPage++;
                            fetchKoreanMovies(currentPage);
                        }
                    }
                });
            }

            // --- FETCH DATA BERANDA ---
            async function fetchKoreanMovies(page) {
                isFetching = true;
                loadingSpinner.style.display = 'block';
                // MENAMBAHKAN EFEK BLUR SAAT LOAD
                movieGrid.classList.add('is-loading'); 
                
                try {
                    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&page=${page}&sort_by=popularity.desc`);
                    if(!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();
                    
                    if(data.results && data.results.length > 0) {
                        renderMovies(data.results, movieGrid, 'col-xs-4 col-sm-3 col-md-2 col-lg-2');
                    }
                } catch (error) {
                    console.error("Gagal load data list", error);
                } finally {
                    isFetching = false;
                    loadingSpinner.style.display = 'none';
                    movieGrid.classList.remove('is-loading'); // HILANGKAN BLUR
                }
            }

            // --- FETCH DATA DETAIL ---
            async function fetchMovieDetails(id) {
                try {
                    const resDetail = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`);
                    if (!resDetail.ok) throw new Error('404_NOT_FOUND');
                    const movie = await resDetail.json();
                    
                    durasiTMDB = movie.runtime ? movie.runtime * 60 : 0;
                    
                    playerView.style.display = 'block';
                    document.getElementById('detail-title').innerText = movie.title;
                    document.getElementById('detail-rating').innerText = movie.vote_average.toFixed(1) + " / 10";
                    document.getElementById('detail-date').innerText = movie.release_date || 'N/A';
                    document.getElementById('detail-time').innerText = movie.runtime ? movie.runtime + " Minute" : '? Minute';
                    document.getElementById('detail-genre').innerText = movie.genres.map(g => g.name).join(', ') || 'N/A';
                    document.getElementById('detail-status').innerText = movie.status;
                    document.getElementById('detail-desc').innerText = movie.overview ? movie.overview : 'A description is not yet available for this movie.';
                    
                    const backdropUrl = movie.backdrop_path ? (IMG_BG_URL + movie.backdrop_path) : FALLBACK_BACKDROP;
                    const videoEl = document.getElementById('mainVideo');
                    videoEl.setAttribute('poster', backdropUrl);
                    
                    document.getElementById('loginGatePopup').style.backgroundImage = `url('${backdropUrl}')`;
                    document.getElementById('gateMovieTitle').innerText = movie.title;

                    const posterImg = new Image();
                    posterImg.onerror = function() { 
                        videoEl.setAttribute('poster', FALLBACK_BACKDROP); 
                        document.getElementById('loginGatePopup').style.backgroundImage = `url('${FALLBACK_BACKDROP}')`;
                    };
                    posterImg.src = backdropUrl;

                    document.title = `Nonton ${movie.title} - LayarKlx`;

                    const resRel = await fetch(`${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`);
                    const dataRel = await resRel.json();
                    let relatedMovies = dataRel.results;
                    
                    if(!relatedMovies || relatedMovies.length === 0) {
                        const fallback = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&page=1`);
                        const fallbackData = await fallback.json();
                        relatedMovies = fallbackData.results.slice(0, 20);
                    } else {
                        relatedMovies = relatedMovies.slice(0, 20);
                    }
                    
                    renderMovies(relatedMovies, relatedGrid, 'col-xs-6 col-sm-4 col-md-6 col-lg-6');

                } catch (error) {
                    console.error("Error Detail:", error);
                    playerView.style.display = 'none';
                    error404View.style.display = 'block';
                }
            }

            // --- RENDER GRID ---
            function renderMovies(movies, targetContainer, colClasses) {
                movies.forEach(movie => {
                    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
                    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
                    const slug = slugify(movie.title);
                    const posterUrl = movie.poster_path ? (IMG_URL + movie.poster_path) : FALLBACK_POSTER;
                    
                    const cardHTML = `
                        <div class="${colClasses} col-movie">
                            <a href="?id=${movie.id}&title=${slug}" class="movie-card">
                                <div class="poster-container">
                                    <img src="${posterUrl}" alt="${movie.title}" onerror="this.onerror=null; this.src='${FALLBACK_POSTER}';">
                                    <span class="badge-rating"><i class="material-icons" translate="no">star</i> ${rating}</span>
                                </div>
                                <div class="movie-text-area">
                                    <h3 class="movie-title">${movie.title}</h3>
                                    <p class="movie-year">${releaseYear}</p>
                                </div>
                            </a>
                        </div>
                    `;
                    targetContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            }

            // ==========================================
            // LOGIKA VIDEO PLAYER CUSTOM & POPUP 10 DETIK
            // ==========================================
            const video = document.getElementById('mainVideo');
            const videoContainer = document.getElementById('videoContainer');
            const playCenter = document.getElementById('playCenter');
            const playPauseBtn = document.getElementById('playPauseBtn');
            const iconPlay = document.getElementById('iconPlay');
            const muteBtn = document.getElementById('muteBtn');
            const iconMute = document.getElementById('iconMute');
            const progressContainer = document.getElementById('progressContainer');
            const progressFilled = document.getElementById('progressFilled');
            const timeText = document.getElementById('timeText');

            function formatWaktu(seconds) {
                if (isNaN(seconds) || seconds === Infinity) return "00:00";
                let min = Math.floor(seconds / 60);
                let sec = Math.floor(seconds % 60);
                return (min < 10 ? '0' + min : min) + ":" + (sec < 10 ? '0' + sec : sec);
            }

            function togglePlay() {
                if (gateTriggered) return; 

                // Mengaktifkan bar saat pertama kali main
                if (!hasStarted) {
                    videoContainer.classList.add('has-started');
                    hasStarted = true;
                }

                if (video.paused || video.ended) {
                    video.play().catch(e => console.log("Video src dummy/kosong"));
                    iconPlay.innerText = 'pause';
                    playCenter.style.display = 'none';
                    videoContainer.classList.remove('paused');
                } else {
                    video.pause();
                    iconPlay.innerText = 'play_arrow';
                    playCenter.style.display = 'block';
                    videoContainer.classList.add('paused');
                }
            }

            playCenter.addEventListener('click', togglePlay);
            playPauseBtn.addEventListener('click', togglePlay);
            
            // Mencegah play langsung dari video click di hp biar gak bentrok
            document.querySelector('.custom-overlay').addEventListener('click', function(e) {
                if(e.target === this) { togglePlay(); }
            });

            muteBtn.addEventListener('click', () => {
                video.muted = !video.muted;
                iconMute.innerText = video.muted ? 'volume_off' : 'volume_up';
            });

            // LOGIKA GARIS WAKTU & TRIGGER POPUP 10 DETIK
            video.addEventListener('timeupdate', () => {
                
                // 1. POPUP GATEKEEPER 10 DETIK
                if (video.currentTime >= 10 && !gateTriggered) {
                    video.pause();
                    gateTriggered = true; 
                    
                    document.getElementById('loginGatePopup').style.display = 'flex';
                    document.getElementById('controlsBar').style.display = 'none';
                    playCenter.style.display = 'none';
                }

                // 2. GARIS PROGRESS 
                let durasiVideoAsli = video.duration || 1; 
                const percent = (video.currentTime / durasiVideoAsli) * 100;
                progressFilled.style.width = percent + '%';

                // 3. TEKS DURASI 
                let durasiTotalTeks = durasiTMDB > 0 ? durasiTMDB : durasiVideoAsli;
                timeText.innerText = formatWaktu(video.currentTime) + " / " + formatWaktu(durasiTotalTeks);
            });

            video.addEventListener('loadedmetadata', () => {
                let durasiTotalTeks = durasiTMDB > 0 ? durasiTMDB : (video.duration || 0);
                timeText.innerText = "00:00 / " + formatWaktu(durasiTotalTeks);
            });

            progressContainer.addEventListener('click', (e) => {
                if (gateTriggered) return; 
                
                let durasiVideoAsli = video.duration || 1; 
                const rect = progressContainer.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                video.currentTime = pos * durasiVideoAsli;
            });

        }); 
