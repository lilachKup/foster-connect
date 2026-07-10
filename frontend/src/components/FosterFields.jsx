// Shared foster profile field set, used by both registration and profile editing.

export const EMPTY_FOSTER = {
  full_name: "",
  phone: "",
  email: "",
  city: "",
  nearby_city: "",
  can_foster_dogs: false,
  can_foster_cats: false,
  max_dog_weight_kg: "",
  has_children: false,
  has_other_dogs: false,
  has_other_cats: false,
  other_pets_details: "",
  has_car: false,
  previous_experience: "",
  availability_status: "available",
  max_foster_duration_days: "",
  emergency_foster_available: false,
  notes: "",
};

// Convert API response (nulls) into form-friendly values (empty strings).
export function fosterToForm(data) {
  const form = { ...EMPTY_FOSTER };
  for (const key of Object.keys(EMPTY_FOSTER)) {
    const v = data[key];
    if (v === null || v === undefined) continue;
    form[key] = v;
  }
  return form;
}

// Convert form values into an API payload (empty strings -> null, numbers parsed).
export function formToFoster(form) {
  const numberFields = ["max_dog_weight_kg", "max_foster_duration_days"];
  const payload = {};
  for (const [key, value] of Object.entries(form)) {
    if (numberFields.includes(key)) {
      payload[key] = value === "" || value === null ? null : Number(value);
    } else if (typeof value === "string") {
      payload[key] = value.trim() === "" ? null : value;
    } else {
      payload[key] = value;
    }
  }
  // full_name is required by the API; keep it as a string even if blank.
  payload.full_name = form.full_name;
  return payload;
}

function Check({ name, label, values, set }) {
  return (
    <div className="field checkbox">
      <input
        id={name}
        type="checkbox"
        checked={!!values[name]}
        onChange={(e) => set(name, e.target.checked)}
      />
      <label htmlFor={name}>{label}</label>
    </div>
  );
}

export default function FosterFields({ values, set }) {
  return (
    <>
      <fieldset>
        <legend>Contact &amp; location</legend>
        <div className="grid">
          <div className="field">
            <label>Full name *</label>
            <input
              type="text"
              value={values.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              type="text"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Nearby city (also open to fostering for this area)</label>
            <input
              type="text"
              value={values.nearby_city}
              onChange={(e) => set("nearby_city", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>What can you foster?</legend>
        <div className="grid">
          <Check name="can_foster_dogs" label="Can foster dogs" values={values} set={set} />
          <Check name="can_foster_cats" label="Can foster cats" values={values} set={set} />
          <div className="field">
            <label>Maximum dog weight</label>
            <select
              value={values.max_dog_weight_kg}
              onChange={(e) => set("max_dog_weight_kg", e.target.value)}
            >
              <option value={5}>עד 5 ק"ג</option>
              <option value={10}>עד 10 ק"ג</option>
              <option value={15}>עד 15 ק"ג</option>
              <option value={20}>עד 20 ק"ג</option>
              <option value={25}>עד 25 ק"ג</option>
              <option value={30}>עד 30 ק"ג</option>
              <option value="">מעל 30 ק"ג / ללא הגבלה</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Your household</legend>
        <div className="grid">
          <Check name="has_children" label="Has children" values={values} set={set} />
          <Check name="has_other_dogs" label="Has other dogs" values={values} set={set} />
          <Check name="has_other_cats" label="Has other cats" values={values} set={set} />
          <Check
            name="has_car"
            label='Has a car (ומוכן להגיע לאסוף)'
            values={values}
            set={set}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Other pets details</label>
          <textarea
            value={values.other_pets_details}
            onChange={(e) => set("other_pets_details", e.target.value)}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>
            Previous experience (נסיון קודם באימוץ, פוסטרינג או בכלל עם חיות)
          </label>
          <textarea
            value={values.previous_experience}
            onChange={(e) => set("previous_experience", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Availability</legend>
        <div className="grid">
          <div className="field">
            <label>Availability status</label>
            <select
              value={values.availability_status}
              onChange={(e) => set("availability_status", e.target.value)}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="field">
            <label>Max foster duration (days)</label>
            <input
              type="number"
              min="0"
              value={values.max_foster_duration_days}
              onChange={(e) => set("max_foster_duration_days", e.target.value)}
            />
          </div>
          <Check
            name="emergency_foster_available"
            label="Available for emergency fostering"
            values={values}
            set={set}
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Notes</label>
          <textarea
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </fieldset>
    </>
  );
}
