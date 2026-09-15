import Navbar from "../components/Navbar";

/**
 * MainLayout
 * Displays the Navbar at the top
 * and page content below it.
 */
function MainLayout({ children }) {
  return (
    <>
      <Navbar />

      <main>
        {children}
      </main>
    </>
  );
}

export default MainLayout;