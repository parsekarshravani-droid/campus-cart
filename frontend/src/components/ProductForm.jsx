import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Info, Loader2, X } from 'lucide-react';
import { CATEGORIES, CONDITIONS } from '../constants';
import SmartImage from './SmartImage.jsx';

const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const emptyValues = (user) => ({
  title: '',
  description: '',
  category: '',
  price: '',
  originalPrice: '',
  condition: 'Good',
  location: '',
  college: user?.college || '',
});

export default function ProductForm({ initial, user, onSubmit, submitting = false, serverError = '', submitLabel = 'Publish listing' }) {
  const [values, setValues] = useState(() => (initial ? mapInitial(initial) : emptyValues(user)));
  const [existing, setExisting] = useState(initial?.images || []);
  const [removedIds, setRemovedIds] = useState([]);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const previewUrls = useRef(new Set());

  useEffect(() => {
    if (initial) {
      setValues(mapInitial(initial));
      setExisting(initial.images || []);
    }
  }, [initial]);

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const addFiles = (incoming) => {
    const list = Array.from(incoming || []);
    if (!list.length) return;
    const slots = MAX_IMAGES - existing.length - files.length;
    if (slots <= 0) {
      setErrors((current) => ({ ...current, images: `You can upload a maximum of ${MAX_IMAGES} images.` }));
      return;
    }
    const accepted = [];
    for (const file of list.slice(0, slots)) {
      if (!ALLOWED.includes(file.type)) {
        setErrors((current) => ({ ...current, images: 'Only JPG, JPEG, PNG or WebP images are allowed.' }));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setErrors((current) => ({ ...current, images: `“${file.name}” is larger than 5 MB.` }));
        continue;
      }
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      accepted.push({ file, preview, key: `${file.name}-${file.lastModified}-${Math.random()}` });
    }
    if (accepted.length) {
      setErrors((current) => ({ ...current, images: undefined }));
      setFiles((current) => [...current, ...accepted]);
    }
  };

  const removeNewFile = (item) => {
    URL.revokeObjectURL(item.preview);
    previewUrls.current.delete(item.preview);
    setFiles((current) => current.filter((entry) => entry.key !== item.key));
  };

  const removeExisting = (image) => {
    const identifier = image.publicId || image.url;
    setExisting((current) => current.filter((entry) => (entry.publicId || entry.url) !== identifier));
    setRemovedIds((current) => [...current, identifier]);
  };

  const validate = () => {
    const next = {};
    if (values.title.trim().length < 3) next.title = 'Title must be at least 3 characters.';
    if (values.description.trim().length < 10) next.description = 'Add a description of at least 10 characters.';
    if (!values.category) next.category = 'Choose a category.';
    if (values.price === '' || Number(values.price) < 0 || Number.isNaN(Number(values.price)))
      next.price = 'Enter a valid price.';
    if (values.originalPrice !== '' && Number(values.originalPrice) < 0)
      next.originalPrice = 'Original price cannot be negative.';
    if (!CONDITIONS.includes(values.condition)) next.condition = 'Choose the condition.';
    if (values.location.trim().length < 2) next.location = 'Where should the buyer pick this up?';
    if (!values.college.trim()) next.college = 'College is required.';
    if (existing.length + files.length === 0) next.images = 'Add at least one product photo.';
    if (existing.length + files.length > MAX_IMAGES) next.images = `Maximum ${MAX_IMAGES} images per listing.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '') formData.append(key, value);
    });
    if (removedIds.length) formData.append('removedImages', JSON.stringify(removedIds));
    files.forEach(({ file }) => formData.append('images', file));
    onSubmit(formData);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="form-error" role="alert">
          <AlertCircle size={16} /> {serverError}
        </div>
      )}

      <div className="card card--pad">
        <h3 style={{ marginTop: 0 }}>Product details</h3>
        <div className="form-grid">
          <div className="field field--full">
            <label className="field__label" htmlFor="title">
              Title <span>*</span>
            </label>
            <input
              id="title"
              className="input"
              value={values.title}
              onChange={(event) => setField('title', event.target.value)}
              maxLength={120}
              placeholder="e.g. Casio FX-991EX Scientific Calculator"
            />
            {errors.title && <p className="field__error">{errors.title}</p>}
          </div>

          <div className="field field--full">
            <label className="field__label" htmlFor="description">
              Description <span>*</span>
            </label>
            <textarea
              id="description"
              className="textarea"
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
              maxLength={4000}
              placeholder="Condition, age, what's included, why you're selling, and anything a buyer should know."
            />
            <div className="row row--between">
              {errors.description ? <p className="field__error">{errors.description}</p> : <span className="field__hint">Be honest about wear and tear — it builds trust.</span>}
              <span className="field__hint">{values.description.length}/4000</span>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="category">
              Category <span>*</span>
            </label>
            <select
              id="category"
              className="select"
              value={values.category}
              onChange={(event) => setField('category', event.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {errors.category && <p className="field__error">{errors.category}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="condition">
              Condition <span>*</span>
            </label>
            <select
              id="condition"
              className="select"
              value={values.condition}
              onChange={(event) => setField('condition', event.target.value)}
            >
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
            {errors.condition && <p className="field__error">{errors.condition}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="price">
              Your price (₹) <span>*</span>
            </label>
            <div className="input-affix">
              <span>₹</span>
              <input
                id="price"
                className="input"
                type="number"
                min="0"
                step="1"
                value={values.price}
                onChange={(event) => setField('price', event.target.value)}
                placeholder="250"
              />
            </div>
            {errors.price && <p className="field__error">{errors.price}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="originalPrice">
              Original price (₹) <span className="muted small">optional</span>
            </label>
            <div className="input-affix">
              <span>₹</span>
              <input
                id="originalPrice"
                className="input"
                type="number"
                min="0"
                step="1"
                value={values.originalPrice}
                onChange={(event) => setField('originalPrice', event.target.value)}
                placeholder="795"
              />
            </div>
            {errors.originalPrice ? (
              <p className="field__error">{errors.originalPrice}</p>
            ) : (
              <p className="field__hint">Shows buyers how much they save.</p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="location">
              Pickup location <span>*</span>
            </label>
            <input
              id="location"
              className="input"
              value={values.location}
              onChange={(event) => setField('location', event.target.value)}
              maxLength={120}
              placeholder="e.g. Central Library Gate"
            />
            {errors.location && <p className="field__error">{errors.location}</p>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="college">
              College <span>*</span>
            </label>
            <input
              id="college"
              className="input"
              value={values.college}
              onChange={(event) => setField('college', event.target.value)}
              maxLength={120}
              placeholder="Your college name"
            />
            {errors.college && <p className="field__error">{errors.college}</p>}
          </div>
        </div>
      </div>

      <div className="card card--pad">
        <div className="row row--between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Product photos</h3>
          <span className="badge badge--indigo">
            {existing.length + files.length}/{MAX_IMAGES} photos
          </span>
        </div>

        <label
          className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <ImagePlus size={26} />
          <strong>Click to upload or drag images here</strong>
          <span>JPG, JPEG, PNG or WebP · up to 5 images · max 5 MB each</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>

        {errors.images && <p className="field__error" style={{ marginTop: 8 }}>{errors.images}</p>}

        {(existing.length > 0 || files.length > 0) && (
          <div className="preview-grid">
            {existing.map((image, index) => (
              <div key={image.publicId || image.url} className="preview-item">
                <SmartImage src={image.url} alt={`Existing photo ${index + 1}`} />
                <span className="preview-item__tag">Saved</span>
                <button type="button" onClick={() => removeExisting(image)} aria-label="Remove saved photo">
                  <X size={14} />
                </button>
              </div>
            ))}
            {files.map((item) => (
              <div key={item.key} className="preview-item">
                <img src={item.preview} alt={item.file.name} />
                <span className="preview-item__tag">New</span>
                <button type="button" onClick={() => removeNewFile(item)} aria-label="Remove new photo">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="note" style={{ marginTop: 16 }}>
          <Info size={16} />
          <span>
            First photo becomes the cover image. Uploaded images are stored in Cloudinary when configured, otherwise on
            the API disk in development.
          </span>
        </div>
      </div>

      <div className="row row--end">
        <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
          {submitting && <Loader2 size={17} className="spinner--sm" />} {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function mapInitial(product) {
  return {
    title: product.title || '',
    description: product.description || '',
    category: product.category || '',
    price: product.price ?? '',
    originalPrice: product.originalPrice ?? '',
    condition: product.condition || 'Good',
    location: product.location || '',
    college: product.college || '',
  };
}
