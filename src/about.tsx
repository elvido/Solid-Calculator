import './index.css';

export default function About() {
  return (
    <div class="flex justify-center items-center min-h-screen bg-base-200">
      <div class="card w-full max-w-xl shadow-xl bg-base-100 relative">
        <div class="card-body">
          <h2 class="text-2xl font-bold text-base-content text-opacity-70">About this Solid Calculator</h2>
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
          <div class="flex justify-between items-center mt-4">
            <a href="/" class="btn btn-outline btn-sm">
              Back to Solid Calculator
            </a>
            <a
              href="https://github.com/elvido/Solid-Calculator"
              target="_blank"
              rel="noopener"
              class="text-base-content opacity-60 hover:opacity-100 transition-opacity mr-5"
              aria-label="View project on GitHub"
              title="View on GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.624-5.475 5.922.43.37.823 1.102.823 2.222v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
