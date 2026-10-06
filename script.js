document.querySelectorAll("[data-current-year]").forEach((target) => {
  target.textContent = new Date().getFullYear();
});

const header = document.querySelector("[data-header]");
const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealTargets.forEach((target) => observer.observe(target));
}
