import { useState } from "react";
import {
  CLIENT_TYPES, SEX, CC1, CC2, CC3, SCALE, SQD, EMPTY_FORM,
} from "./surveyData.js";
import { API_BASE } from "./api.js";

// 2.2.1 Implement survey form and response submission (Frontend)

function RadioBox({ name, label, checked, onChange, disabled = false }) {
  return (
    <label className={`radio-box ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="radio-dot" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

function SectionTitle({ number, children }) {
  return (
    <h2 className="section-title">
      <span className="section-number">{number}</span>
      {children}
    </h2>
  );
}

function FieldError({ message }) {
  return message ? <p className="field-error" role="alert">{message}</p> : null;
}

const CC2_NA = CC2[4]; // "5. N/A"
const CC3_NA = CC3[3]; // "4. N/A"
const today = () => new Date().toISOString().slice(0, 10);

// Same rules as the backend (Services/surveyValidation.js)
function validate(form, ratings) {
  const e = {};
  if (!form.clientType) e.clientType = "Please select your client type.";
  if (!form.service.trim()) e.service = "Please enter the service you availed.";
  else if (form.service.trim().length > 150) e.service = "Service availed is too long (max 150 characters).";

  if (form.date && form.date > today()) e.date = "The date cannot be in the future.";
  if (form.age !== "") {
    const n = Number(form.age);
    if (!Number.isInteger(n) || n < 0 || n > 120) e.age = "Age must be a whole number from 0 to 120.";
  }
  if (form.region.length > 100) e.region = "Region is too long (max 100 characters).";

  if (!form.cc1) e.cc1 = "Please answer CC1.";
  else if (!form.cc1.startsWith("4.")) {
    if (!form.cc2) e.cc2 = "Please answer CC2.";
    if (!form.cc3) e.cc3 = "Please answer CC3.";
  }

  SQD.forEach((_, i) => {
    if (ratings[`SQD${i}`] === undefined) e[`SQD${i}`] = "Please select a rating.";
  });

  if (form.suggestions.length > 1000) e.suggestions = "Suggestions are too long (max 1000 characters).";
  return e;
}

export default function SurveyForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [ratings, setRatings] = useState({});
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key) => setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Rule: CC2 and CC3 are "N/A" when CC1 option 4 is selected
      if (key === "cc1" && value.startsWith("4.")) {
        next.cc2 = CC2_NA;
        next.cc3 = CC3_NA;
      }
      return next;
    });
    clearError(key);
    if (key === "cc1") { clearError("cc2"); clearError("cc3"); }
  };

  const setRating = (id, col) => {
    setRatings((r) => ({ ...r, [id]: col }));
    clearError(id);
  };

  const naLocked = form.cc1.startsWith("4.");

  const scrollToFirstError = () =>
    setTimeout(() => {
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSent(false);

    const found = validate(form, ratings);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      scrollToFirstError();
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ratings }),
      });
      const result = await res.json();

      if (result.success) {
        setForm(EMPTY_FORM); // nililinis ang mga sagot
        setRatings({});      // nililinis ang SQD0 hanggang SQD8
        setSent(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerError(result.message || "Hindi na-submit ang survey.");
      }
    } catch {
      setServerError("Hindi makakonekta sa server. Siguraduhing tumatakbo ang backend.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <p className="eyebrow">MUNICIPALITY OF BALAYAN · PROVINCE OF BATANGAS</p>
          <h1>Help us serve you better.</h1>
          <h3>Client Satisfaction Measurement (CSM)</h3>
          <p className="hero-text">
            This Client Satisfaction Measurement (CSM) tracks the customer experience of government
            offices. Your feedback on your recently concluded transaction will help this office
            provide a better service.
          </p>
          <p className="hero-note">
            Personal information shared will be kept confidential and you always have the option to
            not answer this form.
          </p>
        </div>
      </section>

      {/* FORM */}
      <main className="container" id="survey">
        {sent && (
          <div className="success" role="status">
            Thank you for helping us improve our services. Your feedback has been submitted.
          </div>
        )}

        {serverError && (
          <div className="error-banner" role="alert">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* 01 CLIENT INFORMATION */}
          <section className="card">
            <SectionTitle number="01">Client information</SectionTitle>
            <p className="muted">
              Tell us about your recently concluded transaction. You may leave personal details
              (date, sex, age, region) blank. Fields marked <span className="req">*</span> are required.
            </p>

            <div className="field" data-invalid={!!errors.clientType}>
              <span className="label">Client type <span className="req">*</span></span>
              <div className="row row-client">
                {CLIENT_TYPES.map((t) => (
                  <RadioBox
                    key={t}
                    name="clientType"
                    label={t}
                    checked={form.clientType === t}
                    onChange={() => set("clientType", t)}
                  />
                ))}
              </div>
              <FieldError message={errors.clientType} />
            </div>

            <div className="grid-3">
              <div className="field" data-invalid={!!errors.date}>
                <label className="label" htmlFor="date">Date (optional)</label>
                <input
                  id="date"
                  className="input"
                  type="date"
                  max={today()}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
                <FieldError message={errors.date} />
              </div>
              <div className="field">
                <span className="label">Sex (optional)</span>
                <div className="row row-sex">
                  {SEX.map((s) => (
                    <RadioBox
                      key={s}
                      name="sex"
                      label={s}
                      checked={form.sex === s}
                      onChange={() => set("sex", s)}
                    />
                  ))}
                </div>
              </div>
              <div className="field" data-invalid={!!errors.age}>
                <label className="label" htmlFor="age">Age (optional)</label>
                <input
                  id="age"
                  className="input"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  inputMode="numeric"
                  placeholder="Enter age"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                />
                <FieldError message={errors.age} />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="region">Region of residence (optional)</label>
                <input
                  id="region"
                  className="input"
                  placeholder="Enter your region"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                />
                <FieldError message={errors.region} />
              </div>
              <div className="field" data-invalid={!!errors.service}>
                <label className="label" htmlFor="service">Service availed <span className="req">*</span></label>
                <input
                  id="service"
                  className="input"
                  placeholder="Enter the service you availed"
                  value={form.service}
                  onChange={(e) => set("service", e.target.value)}
                />
                <FieldError message={errors.service} />
              </div>
            </div>
          </section>

          {/* 02 CITIZEN'S CHARTER */}
          <section className="card">
            <SectionTitle number="02">Citizen’s Charter</SectionTitle>
            <p className="info-box">
              Check mark (✓) your answer to the Citizen’s Charter (CC) questions. The Citizen’s
              Charter is an official document that reflects the services of a government
              agency/office including its requirements, fees, and processing times among others.
            </p>

            <div className="field" data-invalid={!!errors.cc1}>
              <p className="question"><b>CC1</b> Which of the following best describes your awareness of a CC?</p>
              <div className="stack">
                {CC1.map((o) => (
                  <RadioBox key={o} name="cc1" label={o} checked={form.cc1 === o} onChange={() => set("cc1", o)} />
                ))}
              </div>
              <FieldError message={errors.cc1} />
              <p className="hint">If you select option 4 in CC1, CC2 and CC3 are automatically set to ‘N/A’.</p>
            </div>

            <div className="field" data-invalid={!!errors.cc2}>
              <p className="question">
                <b>CC2</b> If aware of CC (answered 1–3 in CC1), would you say that the CC of this office was…?
              </p>
              <div className="grid-choice">
                {CC2.map((o) => (
                  <RadioBox key={o} name="cc2" label={o} checked={form.cc2 === o} disabled={naLocked} onChange={() => set("cc2", o)} />
                ))}
              </div>
              <FieldError message={errors.cc2} />
            </div>

            <div className="field" data-invalid={!!errors.cc3}>
              <p className="question">
                <b>CC3</b> If aware of CC (answered codes 1–3 in CC1), how much did the CC help you in your transaction?
              </p>
              <div className="grid-choice">
                {CC3.map((o) => (
                  <RadioBox key={o} name="cc3" label={o} checked={form.cc3 === o} disabled={naLocked} onChange={() => set("cc3", o)} />
                ))}
              </div>
              <FieldError message={errors.cc3} />
            </div>
          </section>

          {/* 03 SERVICE QUALITY RATINGS */}
          <section className="card">
            <SectionTitle number="03">Service quality ratings</SectionTitle>
            <p className="muted">
              For SQD0-8, please put a check mark (✓) on the column that best corresponds to your answer.
            </p>
            <p className="muted small">Select one answer for each statement. Choose N/A if it is not applicable.</p>

            <div className="table-wrap ratings-desktop">
              <table className="ratings">
                <thead>
                  <tr>
                    <th className="th-exp" colSpan={2}>Your experience</th>
                    {SCALE.map((s) => (
                      <th key={s.join(" ")} className="th-scale">
                        {s.map((line) => (
                          <span key={line}>{line}</span>
                        ))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SQD.map((text, i) => {
                    const id = `SQD${i}`;
                    return (
                      <tr key={id} data-invalid={!!errors[id]} className={errors[id] ? "row-error" : ""}>
                        <td className="sqd-id">{id}</td>
                        <td className="sqd-text">
                          {text}
                          <FieldError message={errors[id]} />
                        </td>
                        {SCALE.map((s, col) => (
                          <td key={col} className="sqd-cell">
                            <input
                              type="radio"
                              className="round"
                              name={id}
                              aria-label={`${id}: ${s.join(" ")}`}
                              checked={ratings[id] === col}
                              onChange={() => setRating(id, col)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile layout: one card per statement */}
            <div className="ratings-mobile">
              {SQD.map((text, i) => {
                const id = `SQD${i}`;
                return (
                  <div key={id} className="sqd-card" data-invalid={!!errors[id]}>
                    <p className="question"><b>{id}</b> {text}</p>
                    <div className="stack">
                      {SCALE.map((s, col) => (
                        <RadioBox
                          key={col}
                          name={`m-${id}`}
                          label={s.join(" ")}
                          checked={ratings[id] === col}
                          onChange={() => setRating(id, col)}
                        />
                      ))}
                    </div>
                    <FieldError message={errors[id]} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* 04 SUGGESTIONS */}
          <section className="card">
            <SectionTitle number="04">Suggestions</SectionTitle>
            <label className="label" htmlFor="suggestions">
              Suggestions on how we can further improve our services (optional):
            </label>
            <textarea
              id="suggestions"
              className="input textarea"
              rows={4}
              placeholder="Share your suggestions..."
              value={form.suggestions}
              maxLength={1000}
              onChange={(e) => set("suggestions", e.target.value)}
            />
            <FieldError message={errors.suggestions} />
            <div className="submit-row">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
              <span className="muted small">Thank you for helping us improve our services.</span>
            </div>
          </section>
        </form>
      </main>
    </>
  );
}
