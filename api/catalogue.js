const { json, method, db, fail } = require('../lib/api-helpers');
module.exports = async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    const rows = await db('artworks?select=id,title,year,medium,series,image_path,price_eur,status,available,story&order=title.asc');
    return json(res, 200, { works: rows.map(w => ({ id:w.id, title:w.title, year:w.year, medium:w.medium, series:w.series, img:w.image_path, price:w.price_eur == null ? null : Number(w.price_eur), status:w.status, available:w.available, story:w.story })) });
  } catch (error) { return fail(res, error); }
};
