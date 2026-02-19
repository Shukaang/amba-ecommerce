// lib/utils/cart-animation.ts
export const createCartAnimation = (startRect: DOMRect) => {
  // Create animation element
  const animationEl = document.createElement('div');
  animationEl.className = 'fixed z-[100] pointer-events-none';
  
  // Clone the clicked button's content
  animationEl.innerHTML = `
    <div class="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    </div>
  `;
  
  document.getElementById('cart-animation-element')?.appendChild(animationEl);
  
  // Get cart position
  const cartIcon = document.querySelector('a[href="/cart"]');
  const endRect = cartIcon?.getBoundingClientRect() || { left: window.innerWidth - 100, top: 80 };
  
  // Start position
  const startX = startRect.left + startRect.width / 2 - 20;
  const startY = startRect.top + startRect.height / 2 - 20;
  
  // End position
  const endX = endRect.left + (endRect.width || 0) / 2 - 20;
  const endY = endRect.top + (endRect.height || 0) / 2 - 20;
  
  // Set initial position
  Object.assign(animationEl.style, {
    left: `${startX}px`,
    top: `${startY}px`,
    transform: 'scale(1)',
    opacity: '1',
  });
  
  // Animate
  const animation = animationEl.animate([
    { 
      transform: `translate(0, 0) scale(1)`,
      opacity: 1,
    },
    { 
      transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`,
      opacity: 0,
    }
  ], {
    duration: 800,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  });
  
  // Cleanup
  animation.onfinish = () => {
    animationEl.remove();
  };
};