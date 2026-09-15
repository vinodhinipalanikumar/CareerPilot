// TemplateThumbnail.jsx
// Renders an actual (scaled-down) instance of a resume template component
// so the template picker shows real layout/structure instead of a generic
// placeholder — think Canva's template gallery. Uses SAMPLE_RESUME_DATA
// only; never the user's real resume data.
//
// Implementation: the template components all render at a fixed A4 size
// (8.27in x 11.69in, i.e. 793.92px x 1122.24px at 96dpi). We render that
// full-size output once, then scale the whole thing down with a CSS
// transform to fit a small card. This reuses every template's real JSX
// (no duplicated layout code) and is cheap — it's a single CSS transform,
// not 16 independent expensive renders.

const NATURAL_WIDTH_PX = 793.92; // 8.27in at 96dpi
const NATURAL_HEIGHT_PX = 1122.24; // 11.69in at 96dpi

export default function TemplateThumbnail({ TemplateComponent, formData, font, width = 220 }) {
  const scale = width / NATURAL_WIDTH_PX;
  const height = NATURAL_HEIGHT_PX * scale;

  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-gray-200 bg-white"
      style={{ height }}
      aria-hidden="true"
    >
      <div
        style={{
          width: NATURAL_WIDTH_PX,
          height: NATURAL_HEIGHT_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none", // clicks pass through to the selecting button
        }}
      >
        <TemplateComponent formData={formData} font={font} />
      </div>
    </div>
  );
}
