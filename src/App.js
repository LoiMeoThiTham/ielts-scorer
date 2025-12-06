import './App.css';
import { BookOpen, Loader, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { scoreEssay } from './services/poeApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [taskType, setTaskType] = useState('task2'); // 'task1' or 'task2'
  const [topicInputMode, setTopicInputMode] = useState('manual'); // 'manual' or 'file'
  const [essayText, setEssayText] = useState('');
  const [topicText, setTopicText] = useState('');
  const [uploadedTopics, setUploadedTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('vi'); // 'vi' or 'en' - UI language
  const [responseLanguage, setResponseLanguage] = useState('vi'); // 'vi' or 'en' - AI response language

  const fileInputRef = useRef(null);

  // Language translations
  const translations = {
    vi: {
      title: 'LumiVerse',
      subtitle: 'Chấm điểm tự động với AI',
      taskType: 'Loại bài thi',
      task1: 'Task 1 (Report)',
      task2: 'Task 2 (Essay)',
      topic: 'Đề bài',
      topicPlaceholder: 'Nhập đề bài IELTS Writing ở đây...',
      essay: 'Bài viết của bạn',
      essayPlaceholder: 'Nhập bài viết IELTS của bạn ở đây...',
      words: 'từ',
      responseLanguageLabel: 'Ngôn ngữ phản hồi',
      scoreButton: 'Chấm điểm bài viết',
      scoring: 'Đang chấm điểm...',
      result: '📊 Kết quả chấm điểm',
      instructions: '📋 Hướng dẫn sử dụng',
      step1: 'Chọn loại bài (Task 1 hoặc Task 2)',
      step2: 'Nhập đề bài IELTS Writing',
      step3: 'Chọn ngôn ngữ cho phản hồi',
      step4: 'Viết bài viết (tối thiểu 150 từ)',
      step5: 'Nhấn "Chấm điểm" để nhận kết quả',
      errorEssay: 'Vui lòng nhập bài viết của bạn',
      errorTopic: 'Vui lòng nhập đề bài',
      errorWordCount: 'Bài viết phải có ít nhất 150 từ',
      errorPrefix: 'Lỗi: '
    },
    en: {
      title: 'LumiVerse',
      subtitle: 'Automatic AI Scoring',
      taskType: 'Task Type',
      task1: 'Task 1 (Report)',
      task2: 'Task 2 (Essay)',
      topic: 'Topic',
      topicPlaceholder: 'Enter your IELTS Writing topic here...',
      essay: 'Your Essay',
      essayPlaceholder: 'Enter your IELTS essay here...',
      words: 'words',
      responseLanguageLabel: 'Response Language',
      scoreButton: 'Score Essay',
      scoring: 'Scoring...',
      result: '📊 Scoring Results',
      instructions: '📋 Instructions',
      step1: 'Choose task type (Task 1 or Task 2)',
      step2: 'Enter IELTS Writing topic',
      step3: 'Choose response language',
      step4: 'Write your essay (minimum 150 words)',
      step5: 'Click "Score" to get results',
      errorEssay: 'Please enter your essay',
      errorTopic: 'Please enter the topic',
      errorWordCount: 'Essay must have at least 150 words',
      errorPrefix: 'Error: '
    }
  };

  const t = translations[language];

  const handleScoreEssay = async () => {
    if (!essayText.trim()) {
      setError(t.errorEssay);
      return;
    }
    if (!topicText.trim()) {
      setError(t.errorTopic);
      return;
    }

    const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 150) {
      setError(t.errorWordCount);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response = await scoreEssay(essayText, topicText, taskType, responseLanguage);

    if (response.success) {
      setResult(response.data);
    } else {
      setError(`${t.errorPrefix}${response.error || response.details}`);
    }

    setLoading(false);
  };

  const handleFileUpload = (file) => {
    setFileUploadError(null);

    if (!file.name.endsWith('.json')) {
      setFileUploadError('Vui lòng chọn file JSON');
      return;
    }

    if (file.size > 1024 * 1024) {
      setFileUploadError('File quá lớn (tối đa 1MB)');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (!Array.isArray(json)) {
          setFileUploadError('Format không đúng: cần array');
          return;
        }

        const isValidFormat = json.every(item =>
          item.id && item.topic && item.type &&
          ['task1', 'task2'].includes(item.type)
        );

        if (!isValidFormat) {
          setFileUploadError('Format không đúng: cần {id, topic, type}');
          return;
        }

        setUploadedTopics(json);

        if (json.length > 0) {
          setSelectedTopicId(json[0].id);
          setTopicText(json[0].topic);
          setTaskType(json[0].type);
        }
      } catch (error) {
        setFileUploadError('Không thể đọc file JSON');
      }
    };

    reader.onerror = () => setFileUploadError('Lỗi khi đọc file');
    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleTopicSelection = (e) => {
    const topicId = e.target.value;
    setSelectedTopicId(topicId);

    const selectedTopic = uploadedTopics.find(t => t.id === topicId);
    if (selectedTopic) {
      setTopicText(selectedTopic.topic);
      setTaskType(selectedTopic.type);
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <BookOpen size={32} className="logo-icon" />
            <div>
              <h1 className="logo-title">{t.title}</h1>
              <p className="logo-subtitle">{t.subtitle}</p>
            </div>
          </div>
          <select
            className="language-dropdown"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-container">
        {/* Loại bài thi */}
        <section className="section">
          <h2 className="section-title">{t.taskType}</h2>
          <div className="tabs">
            <button
              className={`tab-button ${taskType === 'task1' ? 'active' : ''}`}
              onClick={() => setTaskType('task1')}
            >
              {t.task1}
            </button>
            <button
              className={`tab-button ${taskType === 'task2' ? 'active' : ''}`}
              onClick={() => setTaskType('task2')}
            >
              {t.task2}
            </button>
          </div>
        </section>

        {/* Response Language Selection */}
        <section className="section">
          <h2 className="section-title">{t.responseLanguageLabel}</h2>
          <select
            className="response-language-dropdown"
            value={responseLanguage}
            onChange={(e) => setResponseLanguage(e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </section>

        {/* Đề bài */}
        <section className="section">
          <h2 className="section-title">{t.topic}</h2>
          <textarea
            className="textarea"
            placeholder={t.topicPlaceholder}
            value={topicText}
            onChange={(e) => setTopicText(e.target.value)}
          />
        </section>

        {/* Bài viết của bạn */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t.essay}</h2>
            <span className="word-count">{essayText.split(/\s+/).filter(w => w.length > 0).length} {t.words}</span>
          </div>
          <textarea
            className="textarea large"
            placeholder={t.essayPlaceholder}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
          />
        </section>

        {/* Error Message */}
        {error && (
          <section className="section error-message">
            <p>{error}</p>
          </section>
        )}

        {/* Score Button */}
        <section className="section">
          <button
            className="btn-score"
            onClick={handleScoreEssay}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={20} className="spinner" /> {t.scoring}
              </>
            ) : (
              <>
                <span>🎯</span> {t.scoreButton}
              </>
            )}
          </button>
        </section>

        {/* Result */}
        {result && (
          <section className="section result-section">
            <h2 className="section-title">{t.result}</h2>
            <div className="result-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Usage Instructions */}
        <section className="section instructions">
          <h3 className="instructions-title">
            <span className="instructions-icon">{t.instructions.split(' ')[0]}</span> {t.instructions.slice(2)}
          </h3>
          <ol className="instructions-list">
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
            <li>{t.step4}</li>
            <li>{t.step5}</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default App;
