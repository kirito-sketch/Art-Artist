# Discover visual browsing

Discover Posts uses controlled Bento groups of three. A portrait-shaped image gets the tall slot, alternating left/right by group. Two known leading portraits get a paired portrait row above a wide supporting tile. A cinematic first image gets a wide slot above supporting images; otherwise two balanced tiles sit above a wider third tile. Shape selects the pattern, not result index alone. Result and keyboard order stay intact. Layout position adds no popularity, creator, paid or quality weighting.

The final one or two items use a full-width tile or equal pair, so partial groups leave no empty slots. Gutters are 10px and corners 16px. Fixed group dimensions reserve space before lazy images load. No masonry measurement, dependency or network request is added.

Photography uses cover with bounded focal positioning; artwork/posters use contain. There is no blurred filler or duplicate background image. Optional media width/height, contentType and focal metadata describe known geometry and intent. Loaded natural dimensions supplement missing geometry, including delivered fallback images. Legacy people/poster paths provide conservative classification; unknown uploads default to a balanced slot until measured. No automatic subject or face detection is claimed. The group height is reserved from initial metadata and does not change as images load; measured geometry can change placement inside it. Small video/set markers only indicate the actual media. Text-only search results retain readable note tiles.

Existing result IDs and selected index pass directly to the vertical post stream. Back restores the mounted Discover surface; images in the stream do not open another lightbox. Each tile retains its labelled keyboard button and list semantics, including when visual placement mirrors the layout.

People, Opportunities, Events, Reviews, structured Projects and Saved posts retain their existing layouts. Portfolio and project imagery shared as posts participates in Bento. The same media geometry/focal system supports profile selected work and hero framing. This creates no additional content collection or permissions.
