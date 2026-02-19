// components/layout/footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-5">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <div className="flex justify-center gap-6 text-center mb-4">
          <p>Privacy Policy</p>
          <p>Terms of Services</p>
        </div>
        &copy; {new Date().getFullYear()} AmbaStore. All rights reserved.
      </div>
    </footer>
  );
}
