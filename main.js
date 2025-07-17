// HEADER SCROLL EFFECT
let lastScroll = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    header.classList.remove('hidden');
    return;
  }

  if (currentScroll > lastScroll && !header.classList.contains('hidden')) {
    header.classList.add('hidden');
  } else if (currentScroll < lastScroll && header.classList.contains('hidden')) {
    header.classList.remove('hidden');
  }

  if (currentScroll > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// BANNER CAROUSEL DAN PARALLAX EFFECT
const navLinks = document.querySelectorAll('.menu a');
const bannerImage = document.querySelector('.banner-image');
const bannerTitle = document.querySelector('.banner-title');
const bannerText = document.querySelector('.banner-text');
const bannerPrevBtn = document.getElementById('banner-prev');
const bannerNextBtn = document.getElementById('banner-next');

const bannerContentMap = {
  work: {
    title: 'Work',
    text: 'Explore our diverse portfolio of projects and innovative solutions.'
  },
  about: {
    title: 'About us',
    text: 'Learn more about Suitmedia, our mission, vision, and values..'
  },
  services: {
    title: 'Services',
    text: 'Discover the various digital services we offer to help your business grow.'
  },
  ideas: {
    title: 'Ideas',
    text: 'Where all our great things begin.'
  },
  careers: {
    title: 'Carrers',
    text: 'Bergabunglah dengan tim dinamis kami dan bangun karir yang memuaskan bersama Suitmedia.'
  },
  contact: {
    title: 'Our Contact',
    text: 'Hubungi kami untuk pertanyaan, kolaborasi, atau sekadar menyapa.'
  }
};

const sectionIds = Object.keys(bannerContentMap);
let currentBannerIndex = 0;

function updateBannerContent(index) {
  const sectionId = sectionIds[index];
  const content = bannerContentMap[sectionId];
  bannerTitle.textContent = content.title;
  bannerText.textContent = content.text;

  // Update kelas 'active' pada navigasi
  navLinks.forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.menu a[href="#${sectionId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

bannerPrevBtn.addEventListener('click', () => {
  currentBannerIndex = (currentBannerIndex - 1 + sectionIds.length) % sectionIds.length;
  updateBannerContent(currentBannerIndex);
});

bannerNextBtn.addEventListener('click', () => {
  currentBannerIndex = (currentBannerIndex + 1) % sectionIds.length;
  updateBannerContent(currentBannerIndex);
});

// Inisialisasi konten banner
updateBannerContent(currentBannerIndex);

// Efek Parallax Banner
window.addEventListener('scroll', () => {
  const scrollPosition = window.pageYOffset;
  bannerImage.style.transform = `translateY(${scrollPosition * 0.5}px)`; // Sesuaikan multiplier untuk efek parallax
});

// Perbarui event listener navLinks untuk juga memperbarui konten banner
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute('href').substring(1);
    const newIndex = sectionIds.indexOf(sectionId);
    if (newIndex !== -1) {
      currentBannerIndex = newIndex;
      updateBannerContent(currentBannerIndex);
    }
    // Logika scrollIntoView dan active class tetap sama
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    // Jika sectionId adalah 'ideas', tidak perlu scroll, karena konten 'ideas' ada di bawah
    if (sectionId !== 'ideas') {
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// POSTS FETCHING & PAGINATION
let currentState = {
  page: 1,
  perPage: 10, // Default per page
  sort: '-published_at' // Default sort order
};

const sortSelect = document.getElementById('sort');
const perPageSelect = document.getElementById('per-page');
const paginationContainer = document.getElementById('pagination');

async function fetchPosts() {
  try {
    const response = await fetch(`/api/ideas?page[number]=${currentState.page}&page[size]=${currentState.perPage}&sort=${currentState.sort}&append[]=small_image&append[]=medium_image`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Debugging: Lihat struktur response sebenarnya
    console.log('API Response:', result);
    
    // Pastikan struktur response sesuai
    if (!result.meta) {
      console.warn('API tidak mengembalikan meta data, menggunakan default');
      result.meta = {
        current_page: currentState.page,
        total_pages: Math.ceil(result.data.length / currentState.perPage) || 1
      };
    }
    
    return result;
    
  } catch (error) {
    console.error('Error dalam fetchPosts:', error);
    return {
      data: [],
      meta: {
        current_page: 1,
        total_pages: 1
      }
    };
  }
}

// Di dalam fungsi renderPagination
function renderPagination(meta = {}) {
  // Berikan nilai default
  const current_page = meta.current_page || 1;
  const total_pages = meta.total_pages || 1;
  
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
}

function renderPosts(posts) {
  const grid = document.getElementById('posts-grid');
  grid.innerHTML = ''; // Hapus postingan sebelumnya

  if (posts.length === 0) {
    grid.innerHTML = '<p>Tidak ada postingan yang ditemukan.</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.className = 'post-card';
    // Gunakan pilihan URL gambar yang lebih kuat atau placeholder
    const imageUrl = post.medium_image?.url || post.small_image?.url || 'https://via.placeholder.com/400x300';
    card.innerHTML = `
      <img class="post-image lazyload"
           data-src="${imageUrl}"
           alt="${post.title}">
      <div class="post-content">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-date">${new Date(post.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    `;
    grid.appendChild(card);
  });
  // Inisialisasi lazyload setelah gambar baru ditambahkan
  lazyload.init();
}

function renderPagination(paginationMeta) {
  paginationContainer.innerHTML = '';
  const { current_page, total_pages } = paginationMeta;

  // Tombol Previous
  const prevButton = document.createElement('button');
  prevButton.textContent = 'Sebelumnya';
  prevButton.disabled = current_page === 1;
  prevButton.addEventListener('click', async () => {
    currentState.page--;
    const result = await fetchPosts();
    renderPosts(result.data);
    renderPagination(result.meta);
  });
  paginationContainer.appendChild(prevButton);

  // Nomor halaman
  const maxPagesToShow = 5;
  let startPage = Math.max(1, current_page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(total_pages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.toggle('active', i === current_page);
    pageButton.addEventListener('click', async () => {
      currentState.page = i;
      const result = await fetchPosts();
      renderPosts(result.data);
      renderPagination(result.meta);
    });
    paginationContainer.appendChild(pageButton);
  }

  // Tombol Next
  const nextButton = document.createElement('button');
  nextButton.textContent = 'Berikutnya';
  nextButton.disabled = current_page === total_pages;
  nextButton.addEventListener('click', async () => {
    currentState.page++;
    const result = await fetchPosts();
    renderPosts(result.data);
    renderPagination(result.meta);
  });
  paginationContainer.appendChild(nextButton);
}

// Event listener untuk kontrol sort dan per-page
sortSelect.addEventListener('change', async () => {
  currentState.sort = sortSelect.value;
  currentState.page = 1;
  const result = await fetchPosts();
  renderPosts(result.data);
  renderPagination(result.meta);
});

perPageSelect.addEventListener('change', async () => {
  currentState.perPage = parseInt(perPageSelect.value);
  currentState.page = 1;
  const result = await fetchPosts();
  renderPosts(result.data);
  renderPagination(result.meta);
});

// Lazy Loading (script lazy load sederhana)
// Ini adalah contoh minimal, untuk produksi, pertimbangkan library seperti `IntersectionObserver`
const lazyload = {
  init: function() {
    const lazyImages = document.querySelectorAll('.lazyload');
    if ('IntersectionObserver' in window) {
      let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            let lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.remove('lazyload');
            lazyImageObserver.unobserve(lazyImage);
          }
        });
      });

      lazyImages.forEach(function(lazyImage) {
        lazyImageObserver.observe(lazyImage);
      });
    } else {
      // Fallback untuk browser yang tidak mendukung Intersection Observer
      lazyImages.forEach(function(lazyImage) {
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove('lazyload');
      });
    }
  }
};


// Muat postingan saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
  const result = await fetchPosts();
  renderPosts(result.data);
  renderPagination(result.meta);
  lazyload.init();
});