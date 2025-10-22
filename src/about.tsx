import './index.css';

export default function About() {
  return (
    <div class="flex justify-center items-center min-h-screen bg-base-200">
      <div class="card w-full max-w-xl shadow-xl bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-primary">About this Solid Calculator</h2>
          <div class="prose max-w-none">
            <p>
              This app is a lightweight Single Page Application (SPA) that implements a desktop calculator{' '}
              <a
                href="https://www.solidjs.com/"
                target="_blank"
                rel="noopener"
                class="link text-primary font-medium underline hover:text-secondary transition-colors duration-150"
              >
                SolidJS
              </a>
              ,{' '}
              <a
                href="https://tailwindcss.com/"
                target="_blank"
                rel="noopener"
                class="link text-primary font-medium underline hover:text-secondary transition-colors duration-150"
              >
                TailwindCSS
              </a>
              ,{' '}
              <a
                href="https://daisyui.com/"
                target="_blank"
                rel="noopener"
                class="link text-primary font-medium underline hover:text-secondary transition-colors duration-150"
              >
                DaisyUI
              </a>
              ,{' '}
              <a
                href="https://rollupjs.org/"
                target="_blank"
                rel="noopener"
                class="link text-primary font-medium underline hover:text-secondary transition-colors duration-150"
              >
                Rollup
              </a>
              , and{' '}
              <a
                href="https://yarnpkg.com/"
                target="_blank"
                rel="noopener"
                class="link text-primary font-medium underline hover:text-secondary transition-colors duration-150"
              >
                Yarn
              </a>
              . It serves as a clean, modular template for new projects built on the same modern frontend stack.
            </p>
            <p>
              Built with <span class="text-red-500">❤️</span> by Ralf and collaborators, it emphasizes clarity,
              flexibility, and maintainability.
            </p>
          </div>
          <div class="card-actions justify-end mt-4">
            <a href="/" class="btn btn-outline btn-sm">
              Back to Solid Calculator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
