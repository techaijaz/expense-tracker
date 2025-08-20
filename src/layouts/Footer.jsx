export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white fixed bottom-0 w-full">
      <div className="border-t border-gray-700 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} MyWebsite. All rights reserved.
      </div>
    </footer>
  );
}
