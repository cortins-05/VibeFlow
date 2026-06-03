# Informe: cómo exportan playlists las apps de YouTube / YouTube Music

**Fecha:** 28 de mayo de 2026  
**Autor:** Lucas / Informe preparado con investigación previa  
**Tema:** Formatos y métodos usados por apps y servicios para exportar playlists de YouTube / YouTube Music.

---

## 1. Resumen ejecutivo

Las apps que exportan playlists de YouTube o YouTube Music suelen funcionar de dos maneras principales:

1. **Conectando la cuenta del usuario mediante autorización**, como hacen Soundiiz, TuneMyMusic, FreeYourMusic o MusConv. El usuario inicia sesión, concede permisos, selecciona playlists, canciones favoritas, álbumes o artistas, y la plataforma genera un archivo o transfiere la lista a otro servicio.

2. **Leyendo una URL pública de playlist**, como hacen extensiones o webs de “YouTube playlist exporter”. En este caso normalmente se pega la URL de la playlist y la herramienta extrae metadatos visibles: título, autor/canal, duración, ID del vídeo, URL, miniatura, vistas, fecha de publicación, etc.

La conclusión más importante es que estas herramientas **no suelen exportar canciones como archivos de audio**, sino **listas de metadatos**. Es decir, exportan “qué canciones/vídeos había en la playlist”, no los archivos `.mp3`, `.m4a`, `.wav` o similares.

Las salidas más comunes son:

- **CSV / Excel**
- **TXT**
- **JSON**
- **XML / XSPF**
- **HTML / Bookmark HTML**
- **Markdown**
- **YAML**
- **SQLite**, en herramientas más técnicas

---

## 2. Herramientas investigadas

| Herramienta | Tipo | Formatos indicados | Observaciones |
|---|---|---|---|
| **Soundiiz** | Plataforma de gestión/transferencia entre servicios | CSV/Excel, TXT, JSON, XML, XSPF, URL | Permite “Export as File” desde playlists, tracks, álbumes y artistas. En YouTube Music documenta exportación a CSV/Excel y TXT. |
| **TuneMyMusic** | Transferencia entre servicios y exportación a archivo | CSV, TXT | Para YouTube Music indica conectar la cuenta, autorizar y exportar favoritos, artistas, álbumes o playlists. |
| **FreeYourMusic** | Transferencia/backup de bibliotecas musicales | CSV; también se publicita como Excel/XLSX en flujos de backup | Indica que exporta playlists como archivos CSV con información esencial como títulos, artistas y álbumes. |
| **MusConv** | Transferencia entre servicios | CSV | Documenta un flujo “YouTube Music to CSV”: elegir YouTube Music como origen, seleccionar playlists y elegir CSV como destino. |
| **Google Takeout / transferencia oficial** | Transferencia oficial de playlists de YouTube Music a servicios soportados | Transferencia directa, no necesariamente archivo local | Google permite copiar playlists de YouTube Music a servicios soportados, pero con limitaciones. |
| **Extensiones de navegador** | Lectura de la página de YouTube | JSON, CSV, TXT | Algunas extensiones exportan título, vistas, fecha, autor, duración, video ID, URL y miniatura. |
| **Webs tipo “Export YouTube Playlist”** | Exportador por URL pública | CSV, Excel, Text, JSON, Bookmark HTML, Markdown, XML, HTML, YAML, SQLite | Funcionan pegando una URL de playlist y seleccionando formatos/campos. |

---

## 3. Cómo obtienen los datos

### 3.1. Mediante autorización de cuenta

Las herramientas grandes suelen pedir al usuario que conecte su cuenta de YouTube Music o del servicio origen.

El flujo típico es:

1. El usuario elige el servicio de origen.
2. Inicia sesión o autoriza el acceso.
3. La herramienta muestra sus playlists, favoritos, álbumes o artistas.
4. El usuario selecciona lo que quiere exportar.
5. La herramienta genera un archivo o transfiere los datos a otro servicio.

Este es el caso de herramientas como:

- Soundiiz
- TuneMyMusic
- FreeYourMusic
- MusConv

Este método permite acceder a datos privados del usuario, siempre que la autorización lo permita. También suele ser el método más usado por herramientas de migración entre plataformas.

---

### 3.2. Mediante URL pública de playlist

Otras herramientas no requieren necesariamente conectar una cuenta. Funcionan pegando la URL pública de una playlist.

El flujo típico es:

1. El usuario copia la URL de una playlist de YouTube o YouTube Music.
2. La pega en la web o extensión exportadora.
3. La herramienta lee los vídeos visibles de la playlist.
4. El usuario elige formato de salida.
5. Se descarga el archivo resultante.

Este método es frecuente en:

- Extensiones de navegador
- Webs de exportación rápida
- Herramientas simples de backup

La limitación principal es que solo funciona bien con contenido accesible públicamente o visible desde la sesión actual del navegador.

---

### 3.3. Mediante APIs oficiales

En el caso de YouTube, la API oficial relevante es `playlistItems.list`, que permite recuperar elementos de una playlist usando un `playlistId`.

En YouTube, un elemento de playlist suele ser un vídeo. Por eso muchas exportaciones de YouTube tienen campos más propios de vídeo que de música:

- `videoId`
- `title`
- `channelTitle`
- `description`
- `thumbnail`
- `publishedAt`
- `playlistId`
- posición dentro de la playlist

Esto explica por qué los exportadores de YouTube no siempre entregan datos limpios del tipo:

```text
Artista - Canción - Álbum
```

Muchas veces entregan datos más cercanos a:

```text
Título del vídeo - Canal - URL - ID del vídeo - Duración - Miniatura
```

YouTube no siempre representa una canción como una entidad musical perfectamente normalizada. Puede ser un videoclip oficial, audio oficial, lyric video, remix, cover, directo, reupload o vídeo subido por un usuario.

---

## 4. Formatos de salida más habituales

## 4.1. CSV / Excel

Es el formato más común.

Se usa porque:

- se abre fácilmente en Excel, Google Sheets o LibreOffice;
- permite columnas estructuradas;
- es fácil de usar como backup;
- permite importar datos en otros servicios;
- es legible tanto por humanos como por software.

Campos típicos en un CSV de playlist:

```csv
Title,Artist,Album,Duration,URL,Video ID,Thumbnail URL,Channel,Position
Blinding Lights,The Weeknd,After Hours,3:20,https://music.youtube.com/watch?v=...,abc123,https://...,The Weeknd,1
```

Campos frecuentes:

| Campo | Significado |
|---|---|
| `Title` | Nombre visible de la canción o vídeo |
| `Artist` / `Artists` | Artista o artistas |
| `Album` | Álbum |
| `Duration` | Duración |
| `URL` | Enlace a la canción/vídeo |
| `Video ID` | Identificador único de YouTube |
| `Thumbnail URL` | Imagen de miniatura |
| `Channel` / `Author` | Canal o autor |
| `Position` | Orden dentro de la playlist |

No todas las herramientas incluyen todos los campos. Algunas exportan muy pocos datos; otras permiten elegir las columnas.

---

## 4.2. TXT

El TXT suele ser una salida simple.

Puede aparecer como listado de canciones:

```text
The Weeknd - Blinding Lights
Daft Punk - One More Time
Tame Impala - The Less I Know The Better
```

O como listado de URLs:

```text
https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...
```

Ventajas:

- muy fácil de leer;
- útil para copiar/pegar;
- compatible con cualquier editor de texto;
- ocupa poco espacio.

Desventajas:

- pierde estructura;
- no conserva bien campos complejos;
- puede ser ambiguo si no separa artista, título, URL, duración, etc.

---

## 4.3. JSON

JSON aparece sobre todo en extensiones, webs exportadoras y herramientas más técnicas.

Ventajas:

- conserva mejor la estructura;
- permite campos anidados;
- representa bien artistas múltiples, miniaturas, IDs y metadatos;
- es más adecuado para procesos automáticos.

Ejemplo de registro JSON típico:

```json
{
  "title": "Song title",
  "author": "Channel or artist",
  "videoId": "abc123",
  "videoUrl": "https://www.youtube.com/watch?v=abc123",
  "duration": "3:42",
  "thumbnailUrl": "https://...",
  "publishedDate": "2024-01-01",
  "viewCount": 123456
}
```

Campos habituales en JSON:

| Campo | Significado |
|---|---|
| `title` | Título |
| `author` / `channel` | Autor o canal |
| `videoId` | ID del vídeo |
| `videoUrl` | URL |
| `duration` | Duración |
| `thumbnailUrl` | Miniatura |
| `publishedDate` | Fecha de publicación |
| `viewCount` | Vistas |

---

## 4.4. XML / XSPF

Algunas herramientas permiten exportar en XML o XSPF.

XSPF es un formato XML pensado específicamente para playlists.

Ejemplo conceptual:

```xml
<playlist>
  <trackList>
    <track>
      <title>Song title</title>
      <creator>Artist</creator>
      <location>https://...</location>
    </track>
  </trackList>
</playlist>
```

No es el formato más habitual para usuarios normales, pero tiene sentido en sistemas de interoperabilidad musical.

---

## 4.5. HTML, Bookmark HTML, Markdown, YAML y SQLite

Algunas herramientas ofrecen formatos adicionales:

| Formato | Uso habitual |
|---|---|
| **HTML** | Crear una página consultable con la playlist |
| **Bookmark HTML** | Guardar cada vídeo como marcador del navegador |
| **Markdown** | Documentar la playlist en GitHub, Notion, Obsidian, etc. |
| **YAML** | Uso técnico o configuración |
| **SQLite** | Guardar la playlist en una base de datos local |

Estos formatos no son tan universales como CSV o JSON, pero aparecen en exportadores avanzados.

---

## 5. Qué datos suelen exportarse

En YouTube y YouTube Music, el dato fundamental suele ser el identificador del vídeo o canción.

En una playlist de YouTube, lo más estable es el `videoId`, porque:

- el título puede cambiar;
- el canal puede cambiar de nombre;
- algunos vídeos pueden eliminarse;
- algunos vídeos pueden pasar a privado;
- puede haber vídeos bloqueados por región;
- puede haber reuploads o versiones duplicadas.

Campos habituales en exportadores de YouTube:

| Campo | Para qué sirve |
|---|---|
| `Title` | Nombre visible del vídeo/canción |
| `Author` / `Channel` | Canal que publicó el vídeo |
| `Length` / `Duration` | Duración |
| `Video ID` | Identificador único de YouTube |
| `Video URL` | Enlace directo |
| `Thumbnail URL` | Imagen de miniatura |
| `Published Date` | Fecha de publicación del vídeo |
| `View Count` | Número de vistas, si la herramienta lo extrae |
| `Position` | Orden dentro de la playlist |

En exportadores más orientados a música pura, los campos cambian a:

| Campo | Para qué sirve |
|---|---|
| `Track Name` | Nombre de la canción |
| `Artist Name(s)` | Artista o artistas |
| `Album Name` | Álbum |
| `Release Date` | Fecha de lanzamiento |
| `Duration` | Duración |
| `ISRC` | Código internacional de grabación |
| `Explicit` | Si la canción es explícita |
| `Popularity` | Popularidad en la plataforma |
| `Added At` | Fecha en la que se añadió a la playlist |

---

## 6. Diferencia entre exportar desde YouTube y desde servicios musicales

Exportar desde YouTube no es exactamente lo mismo que exportar desde Spotify, Apple Music o Deezer.

### YouTube / YouTube Music

Suelen manejar elementos que pueden ser vídeos.

Ejemplo:

```text
Daft Punk - One More Time (Official Video)
```

Pero eso puede representar:

- el videoclip oficial;
- una subida del canal del artista;
- una subida de otro usuario;
- una versión en directo;
- un remix;
- una letra sincronizada;
- un vídeo no musical.

Por eso los campos más importantes son:

```text
videoId
videoUrl
title
channel
duration
thumbnail
```

### Spotify / Apple Music / Deezer

Suelen manejar canciones más normalizadas.

Ejemplo:

```text
Track name
Artist
Album
ISRC
Duration
Release date
```

Estos servicios están más centrados en la grabación musical oficial. Por eso es más fácil exportar datos limpios de canción.

---

## 7. Limitaciones reales que se repiten

### 7.1. No todo se puede exportar

En la transferencia oficial de YouTube Music existen limitaciones. Google indica que se pueden copiar playlists creadas por el usuario, pero no necesariamente otros contenidos como playlists curadas, ciertos favoritos, contenido subido, contenido privado o podcasts.

Esto significa que una exportación oficial o semioficial puede dejar fuera parte de la biblioteca.

---

### 7.2. Exportar no equivale a sincronizar

Una exportación suele ser una foto fija de la playlist en un momento concreto.

Si después se modifica la playlist original, el archivo exportado no cambia automáticamente.

Ejemplo:

```text
Playlist exportada el 1 de mayo
El usuario añade canciones el 3 de mayo
El CSV exportado sigue teniendo solo las canciones del 1 de mayo
```

Algunas herramientas de pago pueden ofrecer sincronización o backups recurrentes, pero la exportación normal es puntual.

---

### 7.3. YouTube mezcla música y vídeo

Una playlist de YouTube puede contener:

- canciones oficiales;
- videoclips;
- entrevistas;
- conciertos;
- directos;
- vídeos privados;
- vídeos eliminados;
- vídeos bloqueados por país;
- remixes;
- covers;
- Shorts;
- contenido no musical.

Esto complica exportar la playlist como si fuese una lista limpia de canciones.

---

### 7.4. Algunas funciones son de pago

En varias herramientas, exportar playlists completas, sincronizar servicios o descargar archivos avanzados puede requerir plan Premium.

Esto se ve especialmente en plataformas como Soundiiz, que suele reservar funciones de exportación o transferencia avanzada para usuarios de pago.

---

### 7.5. Puede haber datos incompletos o no equivalentes

No todos los campos tienen equivalente entre plataformas.

Ejemplos:

| Dato | Problema |
|---|---|
| `Like` | Puede no existir igual en otro servicio |
| `Play count` | Muchas plataformas no lo exportan |
| `Added date` | A veces se pierde |
| `Album` | Puede no estar claro en YouTube |
| `Artist` | Puede confundirse con el canal |
| `ISRC` | YouTube no siempre lo expone |
| `Duration` | Puede variar entre versiones |
| `Thumbnail` | Puede cambiar o desaparecer |

---

## 8. Clasificación final de formatos por importancia

| Prioridad real | Formato | Por qué se usa |
|---:|---|---|
| 1 | **CSV / Excel** | Estándar práctico para backup, hojas de cálculo e importación entre herramientas. |
| 2 | **TXT** | Muy simple, legible, útil para compartir o copiar/pegar. |
| 3 | **JSON** | Mejor para datos estructurados y exportaciones técnicas. |
| 4 | **XML / XSPF** | Más especializado, útil para interoperabilidad de playlists. |
| 5 | **HTML / Bookmark HTML / Markdown** | Útil para lectura humana, documentación o marcadores. |
| 6 | **YAML / SQLite** | Menos común, más técnico. |

---

## 9. Ejemplos de salidas posibles

### 9.1. CSV básico

```csv
Title,Artist,Album,Duration,URL
Blinding Lights,The Weeknd,After Hours,3:20,https://music.youtube.com/watch?v=...
One More Time,Daft Punk,Discovery,5:20,https://music.youtube.com/watch?v=...
```

### 9.2. CSV orientado a YouTube

```csv
Position,Title,Channel,Video ID,Video URL,Duration,Thumbnail URL
1,Daft Punk - One More Time,Daft Punk,FGBhQbmPwH8,https://www.youtube.com/watch?v=FGBhQbmPwH8,5:22,https://...
```

### 9.3. TXT simple

```text
The Weeknd - Blinding Lights
Daft Punk - One More Time
Tame Impala - The Less I Know The Better
```

### 9.4. TXT de URLs

```text
https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...
```

### 9.5. JSON

```json
[
  {
    "position": 1,
    "title": "Daft Punk - One More Time",
    "channel": "Daft Punk",
    "videoId": "FGBhQbmPwH8",
    "videoUrl": "https://www.youtube.com/watch?v=FGBhQbmPwH8",
    "duration": "5:22",
    "thumbnailUrl": "https://..."
  }
]
```

---

## 10. Conclusión

Las apps de exportación de playlists no tienen un único formato universal, pero el patrón dominante es claro: **extraen metadatos de playlists y los guardan en archivos estructurados**, principalmente **CSV/Excel**, **TXT** y **JSON**.

En YouTube y YouTube Music, las exportaciones suelen estar más centradas en **vídeo, URL e ID** que en datos musicales perfectos. Esto ocurre porque YouTube organiza el contenido como vídeos dentro de playlists, no siempre como canciones normalizadas con artista, álbum, ISRC y fecha de lanzamiento.

Las herramientas más musicales, como Soundiiz, TuneMyMusic, FreeYourMusic o MusConv, intentan traducir esa información a un formato más parecido a biblioteca musical, pero el resultado depende mucho de:

- la calidad de los datos del origen;
- los permisos concedidos por el usuario;
- las restricciones de la plataforma;
- si la playlist es pública o privada;
- si el contenido está disponible, eliminado, bloqueado o duplicado;
- el modelo de negocio de la herramienta exportadora.

En la práctica, **CSV/Excel es el formato dominante para usuarios normales**, **JSON es el más útil para procesos técnicos** y **TXT es el más simple para lectura humana o copia rápida**.

---

## 11. Fuentes consultadas

- Google Help — Transfer your YouTube Music playlists to another service:  
  https://support.google.com/accounts/answer/14792019

- Google Developers — YouTube Data API, `playlistItems.list`:  
  https://developers.google.com/youtube/v3/docs/playlistItems/list

- Soundiiz — Export YouTube Music playlists to CSV/Excel:  
  https://soundiiz.com/tutorial/export-youtube-music-to-excel

- Soundiiz — Export YouTube Music playlists to TXT:  
  https://soundiiz.com/tutorial/export-youtube-music-to-txt

- Soundiiz — Export playlists to Text/CSV/JSON/XML/XSPF:  
  https://soundiiz.com/blog/export-download-your-spotify-playlists-to-text-or-csv/

- TuneMyMusic — Transfer YouTube Music to File:  
  https://www.tunemymusic.com/transfer/youtube-music-to-file

- FreeYourMusic — CSV playlist backup/export:  
  https://freeyourmusic.com/blog/csv

- MusConv — YouTube Music to CSV:  
  https://musconv.com/youtube-music-to-csv/

- Chrome Web Store — YouTube Advanced Playlist Exporter:  
  https://chromewebstore.google.com/detail/youtube-advanced-playlist/njipopjohbjffopcfebochjnjbejhfpc

- Export YouTube Playlist — Web exporter formats:  
  https://export-youtube-playlist.vercel.app/

- Exportify — Spotify CSV export fields, comparison reference:  
  https://github.com/watsonbox/exportify
