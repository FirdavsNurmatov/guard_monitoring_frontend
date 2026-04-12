import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { Globe } from "lucide-react";

const { Option } = Select;

const LanguageSwitcher = ({ size = "default", className = "" }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: "latin", name: "Lotin", flag: "🇺🇿" },
    { code: "russian", name: "Рус", flag: "🇷🇺" },
    { code: "cyrillic", name: "Кирил", flag: "🇺🇿" },
  ];

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-emerald-400" />
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        size={size}
        variant="borderless"
        className="lang-switcher"
        style={{ 
          width: 'auto',
          minWidth: '100px'
        }}
      >
        {languages.map((lang) => (
          <Option key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span className="text-white">{lang.name}</span>
            </span>
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
