// DOM Elements
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('section');
const contactForm = document.getElementById('contact-form');
let newsContainer = document.getElementById('news-container');

if (!newsContainer) {
    console.error('Error: News container element not found. Ensure the element with id "news-container" exists in the HTML.');
}

// Small set of sample articles to use as a fallback during development or when the API is unavailable
const sampleArticles = [
    {
        title: 'Sample: Major vulnerability discovered in popular library',
        description: 'A critical vulnerability was disclosed affecting many applications using the library. Patches are available.',
        url: '#',
        publishedAt: new Date().toISOString()
    },
    {
        title: 'Sample: New ransomware campaign targets enterprises',
        description: 'Security teams report a surge in targeted ransomware attacks using novel evasion techniques.',
        url: '#',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    }
];
// Fallback: try Reddit (token-less) first, then Hacker News as secondary fallback.
// Returns array in same shape as NewsAPI articles.
async function fetchRedditArticles() {
    try {
        // combine two subreddits for broader coverage
        const subs = ['cybersecurity', 'netsec'];
        const fetches = subs.map(s => fetch(`https://www.reddit.com/r/${s}/new.json?limit=25`));
        const responses = await Promise.all(fetches);
        const articles = [];

        for (let i = 0; i < responses.length; i++) {
            const resp = responses[i];
            if (!resp.ok) {
                console.warn(`Reddit fetch for /r/${subs[i]} failed with`, resp.status);
                continue;
            }
            const json = await resp.json();
            if (!json.data || !json.data.children) continue;

            json.data.children.forEach(child => {
                const post = child.data;
                // skip stickied posts
                if (post.stickied) return;
                articles.push({
                    title: post.title || 'No title',
                    description: post.selftext ? (post.selftext.length > 300 ? post.selftext.slice(0, 300) + '…' : post.selftext) : '',
                    url: post.url || `https://reddit.com${post.permalink}`,
                    publishedAt: new Date(post.created_utc * 1000).toISOString()
                });
            });
        }

        // de-duplicate by URL and limit
        const seen = new Set();
        const deduped = [];
        for (const a of articles) {
            if (!a.url || seen.has(a.url)) continue;
            seen.add(a.url);
            deduped.push(a);
            if (deduped.length >= 20) break;
        }

        return deduped;
    } catch (e) {
        console.warn('Reddit fallback fetch error', e);
        return null;
    }
}

async function fetchHnArticles() {
    try {
        const resp = await fetch('https://hn.algolia.com/api/v1/search?query=cybersecurity&tags=story&hitsPerPage=20');
        if (!resp.ok) {
            console.warn('HN Algolia fallback failed with status', resp.status);
            return null;
        }
        const json = await resp.json();
        if (!json.hits || json.hits.length === 0) return [];

        // map into a lightweight article shape similar to NewsAPI
        const articles = json.hits.map(hit => ({
            title: hit.title || hit.story_title || 'No title',
            description: hit._highlightResult && hit._highlightResult.title ? hit._highlightResult.title.value : (hit.story_text || ''),
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            publishedAt: hit.created_at
        }));

        return articles;
    } catch (e) {
        console.warn('HN fallback fetch error', e);
        return null;
    }
}
// Navigation handling (only attach if nav links exist)
if (navLinks && navLinks.length > 0) {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Update active states
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });
} else {
    console.info('No navigation links found; skipping navigation setup.');
}

// Contact form handling (only if form exists on the page)
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        // Here you would typically send the data to a server
        // For now, we'll just log it and show a success message
        console.log('Form submitted with data:', data);
        
        // Show success message
        alert('Thank you for your message! We will get back to you soon.');
        
        // Reset form
        contactForm.reset();
    });
} else {
    console.info('No contact form found on this page; contact form handlers were not attached.');
}

// Fetch and display the latest cybersecurity news
async function fetchNews() {
    try {
        // Read API key from body data attribute. If no meaningful API key is provided, use the free HN fallback.
        const apiKey = (document.body && document.body.dataset && document.body.dataset.apiKey) ? document.body.dataset.apiKey.trim() : '';
        const placeholderKeys = ['', 'YOUR_API_KEY_HERE', 'fde27e74da0a4c14b046add8b2976006'];
        if (placeholderKeys.includes(apiKey)) {
            // No valid API key: use Hacker News Algolia fallback (no token needed)
            newsContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    No valid NewsAPI key provided — loading free fallback results from Hacker News.
                </div>
            `;
            const hn = await fetchHnArticles();
            if (hn && hn.length > 0) {
                displayNews(hn);
                return;
            }
            // if hn fails, fall back to sample articles
            displayNews(sampleArticles);
            return;
        }

        const url = `https://newsapi.org/v2/everything?q=cybersecurity&sortBy=publishedAt&apiKey=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        if (!response.ok) {
            // handle specific, common API error codes with friendlier messages
            if (response.status === 426) {
                newsContainer.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        News API returned <strong>426 Upgrade Required</strong>. This usually means the API plan does not support this request or the API key needs to be upgraded/activated. Showing fallback results from Hacker News.
                    </div>
                `;
                const hn = await fetchHnArticles();
                if (hn && hn.length > 0) displayNews(hn);
                else {
                    newsContainer.innerHTML += `<div class="mb-3"><button id="load-sample" class="btn btn-sm btn-primary">Load sample articles</button></div>`;
                    const b = document.getElementById('load-sample'); if (b) b.addEventListener('click', () => displayNews(sampleArticles));
                }
                return;
            }

            if (response.status === 401) {
                newsContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        Unauthorized (401). Check your News API key — it may be missing or invalid. Showing fallback results from Hacker News.
                    </div>
                `;
                const hn = await fetchHnArticles();
                if (hn && hn.length > 0) displayNews(hn);
                else {
                    newsContainer.innerHTML += `<div class="mb-3"><button id="load-sample" class="btn btn-sm btn-primary">Load sample articles</button></div>`;
                    const b = document.getElementById('load-sample'); if (b) b.addEventListener('click', () => displayNews(sampleArticles));
                }
                return;
            }

            if (response.status === 429) {
                newsContainer.innerHTML = `
                    <div class="alert alert-info" role="alert">
                        Too Many Requests (429). The API rate limit has been reached. Showing fallback results from Hacker News.
                    </div>
                `;
                const hn = await fetchHnArticles();
                if (hn && hn.length > 0) displayNews(hn);
                else {
                    newsContainer.innerHTML += `<div class="mb-3"><button id="load-sample" class="btn btn-sm btn-primary">Load sample articles</button></div>`;
                    const b = document.getElementById('load-sample'); if (b) b.addEventListener('click', () => displayNews(sampleArticles));
                }
                return;
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            displayNews(data.articles);
        } else {
            newsContainer.innerHTML = '<p>No news available at the moment.</p>';
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        // If an error occurred and the container is empty, offer the sample fallback
        if (newsContainer && newsContainer.innerHTML.trim() === '') {
            newsContainer.innerHTML = `
                <div class="alert alert-secondary" role="alert">
                    Failed to load news. You can try again later or load sample articles for development.
                </div>
                <div class="mb-3"><button id="load-sample" class="btn btn-sm btn-primary">Load sample articles</button></div>
            `;
            const btn = document.getElementById('load-sample');
            if (btn) btn.addEventListener('click', () => displayNews(sampleArticles));
        }
    }
}

function displayNews(articles) {
        // Render as Bootstrap cards in a responsive grid
        if (!newsContainer) return;
        const cards = articles.map(article => {
                const title = article.title || 'No title';
                const desc = article.description || '';
                const url = article.url || '#';
                const date = article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '';

                return `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card news-card h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title"><a href="${url}" target="_blank" class="stretched-link text-dark text-decoration-none">${title}</a></h5>
                            <p class="card-text text-muted">${desc}</p>
                            <div class="mt-auto pt-3 d-flex justify-content-between align-items-center">
                                <small class="news-meta">${date}</small>
                                <a href="${url}" target="_blank" class="btn btn-sm btn-outline-primary">Read</a>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        newsContainer.innerHTML = cards;
}

// Load news on page load
fetchNews();