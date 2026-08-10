export default function Footer() {
  return (
    <footer className="border-t-2 border-black dark:border-white bg-white dark:bg-black mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Viele WebApps. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

