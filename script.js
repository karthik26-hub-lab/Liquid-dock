document.addEventListener("DOMContentLoaded", () => {
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const indicator = document.querySelector('.liquid-glass-indicator');
  const navBar = document.querySelector('.bottom-nav');

  let currentActive = document.querySelector('.nav-item.active') || navItems[0];
  
  // Drag state variables
  let isDragging = false;
  let wasDragging = false;
  let startX = 0;
  let initialTranslateX = 0;

  // Helper: Gets the exact position of an icon relative to the navbar
  function getRelativeLeft(element) {
    const navRect = navBar.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    return elRect.left - navRect.left;
  }

  // Helper: Moves the glass with that springy liquid animation
  function moveLiquidGlass(element) {
    const left = getRelativeLeft(element);
    
    // Add the bouncy transition back in
    indicator.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1), width 0.4s ease';
    indicator.style.width = `${element.offsetWidth}px`;
    indicator.style.transform = `translate(${left}px, -50%)`;

    // Update active icon colors
    navItems.forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
    currentActive = element;
  }

  // Wait a tiny bit for CSS to load before initial placement
  setTimeout(() => moveLiquidGlass(currentActive), 50);

  // --- 1. HANDLE NORMAL CLICKS ---
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault(); 
      // If we just finished a drag swipe, ignore the click!
      if (wasDragging) return; 
      moveLiquidGlass(this);
    });
  });

  // --- 2. HANDLE DRAGGING (TOUCH & MOUSE) ---
  navBar.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Ignore right-click
    
    isDragging = true;
    wasDragging = false;
    startX = e.clientX;
    
    // Grab the exact pixel position the indicator is currently at
    const transform = window.getComputedStyle(indicator).transform;
    if (transform !== 'none') {
      const matrixValues = transform.match(/matrix.*\((.+)\)/)[1].split(', ');
      initialTranslateX = parseFloat(matrixValues[4]);
    } else {
      initialTranslateX = getRelativeLeft(currentActive);
    }

    navBar.setPointerCapture(e.pointerId);
  });

  navBar.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    
    // Only trigger drag mode if the user swipes more than 5px (differentiates drag from tap)
    if (Math.abs(deltaX) > 5) {
      wasDragging = true;
      indicator.style.transition = 'none'; // Remove transition so it instantly follows your finger
      
      let newX = initialTranslateX + deltaX;
      
      // Calculate boundaries
      const minX = getRelativeLeft(navItems[0]);
      const maxX = getRelativeLeft(navItems[navItems.length - 1]);
      
      // Add physical "Rubber Band" resistance if you try to drag it out of bounds
      if (newX < minX) {
        newX = minX - Math.sqrt(minX - newX) * 1.5;
      } else if (newX > maxX) {
        newX = maxX + Math.sqrt(newX - maxX) * 1.5;
      }

      // Move it instantly
      indicator.style.transform = `translate(${newX}px, -50%)`;
    }
  });

  navBar.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    // If we were swiping, find the closest icon and snap to it
    if (wasDragging) {
      const transform = window.getComputedStyle(indicator).transform;
      let currentX = 0;
      if (transform !== 'none') {
        const matrixValues = transform.match(/matrix.*\((.+)\)/)[1].split(', ');
        currentX = parseFloat(matrixValues[4]);
      }
      
      const indicatorCenter = currentX + (indicator.offsetWidth / 2);
      
      let closestItem = navItems[0];
      let minDistance = Infinity;

      // Check which icon center is closest to the glass center
      navItems.forEach(item => {
        const itemLeft = getRelativeLeft(item);
        const itemCenter = itemLeft + (item.offsetWidth / 2);
        const distance = Math.abs(indicatorCenter - itemCenter);

