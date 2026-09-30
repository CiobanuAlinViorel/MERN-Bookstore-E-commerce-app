## 1 - Intrebari de verificare

-> Care este diferenta dintre dependencies si devDependencies? Dati cate un exemplu din proiect.

R: Dependencies contine toate dependentele de care aplicatia are nevoie sa ruleze. Ex.: express, dotenv, react-router-dom etc.
In timp ce devDependencies sunt dependente utilizate pentru rularea aplicatiei in diverse etape de productie - dev, test, lint etc. Ex.: nodemon, vitest etc.

-> De ce package-lock.json se urca in Git , iar node_modules nu?

R: package-lock.json se urcă în Git pentru că garantează instalarea exactă a acelorași versiuni (inclusiv tranzitive) pe orice mașină, deci build-uri reproductibile. node_modules nu se urcă pentru că e foarte mare, poate fi regenerat oricând din package.json și lockfile cu npm install/npm ci.

-> Ce s-ar intampla daca .env ar fi urcat pe Github intr-un depozit public?
R: Urcarea fisierului .env ar risca afisarea in spatiul public a credentialelor din aplicatia postata si risca diverse probleme cum ar fi: furt de date, abuz de servicii terte (Stripe, SendGrid, OpenAi etc.), facturi uriase (chesi AWS/cloud), compromiterea aplicatiei.

-> De ce frotend-ul si backend-ul ruleaza pe porturi diferite si ce problema vom avea din acest motiv?
R: Frontend-ul și backend-ul rulează ca procese separate, deci pe porturi diferite (de ex. 3000 și 5000). Pentru browser, porturi diferite înseamnă origini diferite, iar Same-Origin Policy blochează citirea răspunsurilor între ele, generând erori CORS. Se rezolvă fie configurând backend-ul să trimită headerele CORS pentru originea frontend-ului, fie folosind un proxy în dezvoltare, fie servind ambele de pe aceeași origine în producție.
