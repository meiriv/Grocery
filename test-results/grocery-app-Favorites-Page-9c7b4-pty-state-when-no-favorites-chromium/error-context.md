# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - banner [ref=e4]:
      - heading "Favorites" [level=1] [ref=e6]
    - main [ref=e7]:
      - generic [ref=e8]:
        - img [ref=e10]
        - paragraph [ref=e12]: No favorites yet. Tap the heart icon on items to add them.
    - navigation [ref=e13]:
      - generic [ref=e14]:
        - link "My Lists" [ref=e15] [cursor=pointer]:
          - /url: /
          - img [ref=e16]
          - generic [ref=e19]: My Lists
        - link "Favorites" [ref=e20] [cursor=pointer]:
          - /url: /favorites
          - img [ref=e21]
          - generic [ref=e23]: Favorites
        - link "Categories" [ref=e24] [cursor=pointer]:
          - /url: /categories
          - img [ref=e25]
          - generic [ref=e27]: Categories
        - link "Settings" [ref=e28] [cursor=pointer]:
          - /url: /settings
          - img [ref=e29]
          - generic [ref=e32]: Settings
```