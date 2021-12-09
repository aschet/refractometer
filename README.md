# Refraktometer-Rechner

A refractometer calculator for beer brewing purposes suitable for desktop and mobile browsers. Does approximate the alcohol content and residual extract from a refractometer reading before fermentation, and after (or during) the fermentation based on well known correlation models.

- German version: https://aschet.github.io/refractometer
- English version: https://aschet.github.io/refractometer/en

## Correlation Models

This calculator does implement the following correlation models:

- Bonham: The most commonly used correlation before the Terrill Linear model was published.
- Gardner
- Gossett: This model correlates ABW instead of residual extract. Therefore, the residual extract is derived from the ABW.
- Novotný Linear: Used in newer brewing software as successor to the Terrill Linear model.
- Novotný Quadrativ
- Terrill Linear: Probably the most widely used model. Provides less accurate results during fermentation.
- Terrill Quadratic
- Terrill & Novotný: Does select either the Novotný Linear or the Terrill Linear after an initial estimation for a more accurate correlation. See https://www.reddit.com/r/Homebrewing/comments/bs3af9/sean_terrills_website_issues for more information.
