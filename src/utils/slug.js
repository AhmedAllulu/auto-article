import slugify from 'slugify';

export function toSlug(text) {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@/?#,]/g,
  });
}


