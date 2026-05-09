import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv'); dotenv.config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });

const newTheme = {
  fonts: {
    heading: 'Cormorant Garamond, Georgia, serif',
    body: 'Montserrat, Inter, sans-serif',
  },
  colors: {
    primary:        '#D7B777',
    secondary:      '#0C1412',
    accent:         '#D7B777',
    background:     '#081212',
    textColor:      '#FFF7EA',
    lightText:      '#FFF7EA',
    mutedText:      '#CBBEA8',
    cardBackground: 'rgba(8,18,14,0.80)',
    cardBorder:     'rgba(215,183,119,0.22)',
    sectionDarkBg:  '#0C1412',
    sectionLightBg: '#F7F0E3',
    sectionLightText: '#D6C8B0',
  },
};

p.query(
  `UPDATE templates SET config = jsonb_set(config, '{theme}', $1::jsonb) WHERE slug = 'aurelia' RETURNING id, slug`,
  [JSON.stringify(newTheme)]
)
  .then(r => { console.log('Updated rows:', r.rowCount, r.rows); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
