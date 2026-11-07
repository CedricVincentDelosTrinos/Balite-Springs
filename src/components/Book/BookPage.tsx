
import { forwardRef, type ReactNode } from "react";

interface BookPageProps {
  children: ReactNode;
  className?: string;
}

const BookPage = forwardRef<HTMLDivElement, BookPageProps>(
  ({ children, className = "" }, ref) => {
    return (
      <div ref={ref} className={`book-page ${className}`}>
        <div className="book-page-content">
          {children}
        </div>
      </div>
    );
  }
);

BookPage.displayName = "BookPage";

export default BookPage;
