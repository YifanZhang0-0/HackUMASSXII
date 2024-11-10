document.addEventListener('DOMContentLoaded', function() {
  const title = document.getElementById('smoothTitle');
  const showcaseImage = document.getElementById('showcaseImage');
  const imageContainer = document.querySelector('.image-container');
  const runButton = document.getElementById('runButton');
  const textAreas = document.querySelectorAll('.text-area, .console-area');
  const execute = document.querySelector(".Execute")
  // const inputSection = document.querySelector('.input-section');

  const javascript = document.getElementById("javascript")
  

  let currentImage = 1;

  // Smooth title animation
  setTimeout(() => {
      title.classList.add('visible');
  }, 100);

  // Image showcase functionality
  function changeImage() {
      currentImage = currentImage % 5 + 1; // Cycle through 5 random images
      showcaseImage.classList.remove('visible');
      setTimeout(() => {
          showcaseImage.src = `https://picsum.photos/600/400?random=${currentImage}`;
          showcaseImage.classList.add('visible');
      }, 500); // Wait for fade out before changing image
  }

  execute.addEventListener('click', () => {
    fetch("/runlocal", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: 'test.py',
        js: javascript.textContent
      })
    }).then(a => a.json()).then(console.log)
  });

  // Show initial image
  setTimeout(() => {
      showcaseImage.classList.add('visible');
  }, 100);

  // Detect when image container enters the viewport
  function handleScroll() {
    const rect = imageContainer.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      imageContainer.classList.add('visible');
    }
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // IntersectionObserver for the input section animations
  const observerOptions = {
    threshold: 0.5 // Adjust this value as needed
  };

  const inputObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        textAreas.forEach((textArea, index) => {
          setTimeout(() => {
            textArea.classList.add('animated');
          }, index * 200); // Staggered animation effect
        });
        inputObserver.unobserve(entry.target); // Stop observing once triggered
      }
    });
  }, observerOptions);

  inputObserver.observe(inputSection); // Start observing the input section
});
