const ShortLogo = () => {
  return (
    <div className="flex items-center space-x-2">
      {/* Icon */}
      {/* <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01m6.938-2.328a9 9 0 11-13.856-9.674m13.856 9.674L12 3m0 0L5.062 14.328"
          />
        </svg>
      </div> */}
      {/* Text */}
      <h1 className="text-xl font-bold text-gray-800">
        ET<span className="text-green-500">X</span>
      </h1>
    </div>
  );
};

export default ShortLogo;
