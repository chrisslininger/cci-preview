/* ----------------------------------------------------------------------------
 * Testimonials
 * Lifted verbatim from the v4.8 single-file build. Content lives here, outside
 * components, so the same object feeds the page, its metadata and its
 * structured data — what a human reads and what a machine reads cannot drift.
 * -------------------------------------------------------------------------- */

export type Testimonial = {
  /** Doctor's name as shown on the pill. */
  name: string
  /** Running time, e.g. "1:17". */
  dur: string
  /** Mux playback id. */
  id: string
}

export const TESTIMONIALS = [
  {name:'Dr. Jeff Kahrs', dur:'1:17', id:'A21LSsljbccxw2O9500U9IuqeLq00g34T02hdZHFlFgUlw'},
  {name:'Dr. Kevin Lyter', dur:'1:44', id:'Ze5RbuV8YMhnPyv8th6N5FH3ERALc9GKvHSCg00FoEqQ'},
  {name:'Dr. Zach Perry', dur:'1:39', id:'Cv8vCuTsBB02Mm9NRVBId5I45rNwogllO9af7GwSY5oA'},
  {name:'Dr. Josh Silver', dur:'1:18', id:'j4sZdYYoA3c2i7x1w8TocHVIFPYjI00xKL5XL602MD1Tk'},
  {name:'Dr. Drew', dur:'1:13', id:'A9cxLKvjJcX5u02Qzh8agXEOPLMkmNzXTKHPrx02wnG2s'}
] as Testimonial[]
