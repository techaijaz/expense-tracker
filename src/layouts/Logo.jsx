const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      {/* Icon */}
      {/* <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01m6.938-2.328a9 9 0 11-13.856-9.674m13.856 9.674L12 3m0 0L5.062 14.328"
          />
        </svg>
      </div> */}
      {/* Text */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Expense<span className="text-green-500">Tracker</span>
        </h1>
        <p className="text-sm text-gray-500">
          Track your expenses effortlessly
        </p>
      </div>
    </div>
  );
};

export default Logo;
