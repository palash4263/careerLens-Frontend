import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  X,
  CheckCircle2,
  FileText,
  Briefcase,
  Building2,
  File,
} from "lucide-react";

export default function PremiumDropdown({
  label,
  icon,
  options = [],
  value,
  onChange,
  placeholder,
  type = "resume",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }

    const option = options.find((o) => o.id === Number(value));
    setSelectedOption(option || null);
  }, [value, options]);

  useEffect(() => {
    function outsideClick(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", outsideClick);

    return () =>
      document.removeEventListener(
        "mousedown",
        outsideClick
      );
  }, []);

  const filteredOptions = options.filter((item) => {
    if (type === "resume") {
      return item.file_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    }

    return (
      item.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.company
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  function selectOption(option) {
    setSelectedOption(option);
    onChange(option.id.toString());
    setSearchTerm("");
    setIsOpen(false);
  }

  const displayText = () => {
    if (!selectedOption) return placeholder;

    if (type === "resume") {
      return selectedOption.file_name;
    }

    return `${selectedOption.title} at ${selectedOption.company}`;
  };

  return (
    <div
      className={`premium-dropdown-wrapper ${isOpen ? 'is-open' : ''}`}
      ref={dropdownRef}
      style={{ position: 'relative', zIndex: isOpen ? 1000 : 1 }}
    >
      <label className="premium-dropdown-label">
        <span className="label-icon">{icon}</span>

        <span>{label}</span>

        <span className="label-required">*</span>
      </label>

      <motion.div
        className={`premium-dropdown-trigger ${
          isOpen ? "open" : ""
        } ${selectedOption ? "has-value" : ""}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="trigger-left">
          {type === "resume" ? (
            <File size={16} />
          ) : (
            <Briefcase size={16} />
          )}

          <span>{displayText()}</span>
        </div>

        <div className="trigger-right">
          {selectedOption && (
            <CheckCircle2 size={16} />
          )}

          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
            }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="premium-dropdown-panel"
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
          >
            <div className="dropdown-search-wrapper">
              <Search size={16} />

              <input
                className="dropdown-search-input"
                placeholder={`Search ${type}`}
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

              {searchTerm && (
                <X
                  size={16}
                  className="search-clear"
                  onClick={() =>
                    setSearchTerm("")
                  }
                />
              )}
            </div>

            <div className="dropdown-options-list">
              {filteredOptions.length === 0 ? (
                <div className="dropdown-empty">
                  No results found
                </div>
              ) : (
                filteredOptions.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{
                      x: 4,
                    }}
                    className={`dropdown-option ${
                      selectedOption?.id === item.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectOption(item)
                    }
                  >
                    <div className="option-left">
                      {type === "resume" ? (
                        <FileText size={16} />
                      ) : (
                        <Building2 size={16} />
                      )}

                      <div className="option-info">
                        <span className="option-title">
                          {type === "resume"
                            ? item.file_name
                            : item.title}
                        </span>

                        {type === "job" && (
                          <span className="option-subtitle">
                            {item.company}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedOption?.id ===
                      item.id && (
                      <CheckCircle2 size={16} />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedOption && (
        <div className="dropdown-hint">
          {type === "resume"
            ? selectedOption.file_name
            : `${selectedOption.title} at ${selectedOption.company}`}
        </div>
      )}
    </div>
  );
}