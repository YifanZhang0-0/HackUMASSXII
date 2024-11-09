document.addEventListener('DOMContentLoaded', function() {
  const title = document.getElementById('smoothTitle');
  const showcaseImage = document.getElementById('showcaseImage');
  const imageContainer = document.querySelector('.image-container');
  const runButton = document.getElementById('runButton');
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

  runButton.addEventListener('click', changeImage);

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
});
