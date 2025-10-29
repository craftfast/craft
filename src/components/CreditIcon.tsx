/**
 * Credit Icon Component
 * Displays the Craft credit coin icon - a circular coin with the "C" logo centered inside
 */
export function CreditIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer coin circle */}
      <circle
        cx="12"
        cy="12"
        r="11"
        className="fill-neutral-900 dark:fill-white"
      />
      {/* Inner circle for depth */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        className="fill-neutral-100 dark:fill-neutral-800"
      />
      {/* Craft "C" letter - properly centered and scaled */}
      <g transform="translate(6.5, 6) scale(0.15)">
        <path
          d="M0.768 36.608C2.048 29.2693 4.65067 22.8693 8.576 17.408C12.5013 11.8613 17.3653 7.59467 23.168 4.608C29.056 1.536 35.4133 0 42.24 0C51.0293 0 57.8987 2.176 62.848 6.528C67.8827 10.88 70.6987 17.0667 71.296 25.088H51.968C51.456 22.016 50.1333 19.6267 48 17.92C45.8667 16.128 43.008 15.232 39.424 15.232C34.304 15.232 29.9093 17.1093 26.24 20.864C22.656 24.5333 20.2667 29.7813 19.072 36.608C18.6453 38.9973 18.432 41.0453 18.432 42.752C18.432 47.616 19.6267 51.3707 22.016 54.016C24.4053 56.576 27.7733 57.856 32 57.856C39.168 57.856 44.4587 54.6133 47.872 48.128H67.2C63.872 55.808 58.88 61.9093 52.224 66.432C45.6533 70.9547 38.0587 73.216 29.44 73.216C20.48 73.216 13.312 70.6987 7.936 65.664C2.64533 60.544 0 53.632 0 44.928C0 42.2827 0.256 39.5093 0.768 36.608Z"
          className="fill-neutral-900 dark:fill-white"
        />
      </g>
    </svg>
  );
}

export default CreditIcon;
