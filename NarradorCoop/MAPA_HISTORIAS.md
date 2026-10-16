# Mapa de historias

Generado por `NarradorCoop/herramientas/mapa_historias.py` a partir de los arcos. No editar a mano:
se vuelve a generar con `python3 NarradorCoop/herramientas/mapa_historias.py` (necesita `pip install lupa`).
Los lanzadores del servidor estan en la lista `LANZADORES` del script; si se agrega uno, se agrega ahi.
Nota: en el codigo, Eduardo Giovanns todavia se llama `tomas` (su nombre viejo) en ids y memorias.

## Diagrama

Cada flecha sale del final que la provoca y dice que memoria deja. Los nodos redondeados son desenlaces:
decisiones que cierran una linea en vez de abrir otra historia.

```mermaid
flowchart LR
  bandido_1["El camino del bandido: el traidor"]
  bandido_2["El camino del bandido: la comisaria"]
  bandido_3["El camino del bandido: la familia"]
  bandido_4["El camino del bandido: las latas"]
  bandido_5["El camino del bandido: la decision"]
  bandido_castigo["Bandido: el jefe descubre el sabotaje"]
  bandido_maulen["El camino del bandido: Maulen"]
  cal_fonda["La fonda de Sous"]
  cal_amigo_secreto["El amigo secreto de Sous"]
  cap_chela_2["La radio del cuartel"]
  cap_cabo_2["La puerta de atras"]
  cap_nacho_2["El ring de Lexington"]
  cap_nacho_3["La muchacha que esperaba"]
  cap_rosa_2["La ruta 31"]
  cap_rosa_3["El estanque"]
  conquista_sous["La conquista: la base de Sous"]
  conquista_riverside["La conquista: la iglesia del Padre Nacho"]
  conquista_rosewood["La conquista: la bencinera de la Misia Rosa"]
  conquista_muldraugh["La conquista: la comisaria del Cabo Ramiro"]
  conquista_westpoint["La conquista: el cuartel de la Tia Chela"]
  desbloqueo_muldraugh["Cabo Ramiro quiere un campamento"]
  desbloqueo_westpoint["Tia Chela quiere un campamento"]
  desbloqueo_riverside["Padre Nacho quiere un campamento"]
  desbloqueo_rosewood["Misia Rosa quiere un campamento"]
  eduardo_atentado["Eduardo viene por ti"]
  eduardo_fallas["Fallas Lake"]
  reconquista_riverside["La reconquista: la iglesia de Riverside"]
  reconquista_rosewood["La reconquista: la bencinera de Rosewood"]
  reconquista_muldraugh["La reconquista: la comisaria de Muldraugh"]
  reconquista_westpoint["La reconquista: el cuartel de West Point"]
  reconquista_patio["La reconquista: el patio de trenes"]
  eduardo_evento["Eduardo, corriendo"]
  familia_infectada["Los Bell"]
  sous["Sous"]
  sous_guerra["La guerra con Sous"]
  sous_arsenal["El arsenal"]
  favor_benjamin["Favor de Matric"]
  favor_martin_z["Favor de Zent"]
  favor_martin_a["Favor de Akagami"]
  favor_david["Favor de Shinbo"]
  favor_bastian["Favor de Tati"]
  favor_hanz["Favor de Walita"]
  favor_cristian["Favor de Cristonks"]
  favor_jorge["Favor de Hasag"]
  favor_cristobal["Favor de Wertres"]
  hija_cabo["Valentina"]
  leyenda_tomas["Un cientifico que dice tener la cura"]
  tomas_vuelve["Eduardo, otra vez"]
  fin_bandido_pereira_escapo(["El jefe del patio escapa"])
  fin_bandido_rechazado(["Rechaza a la banda (la puerta queda abierta)"])
  fin_bandido_redimido(["Redencion: Knox vuelve a 0"])
  fin_estanque_rosewood_defendido(["El estanque queda a salvo"])
  fin_fin_eduardo_muerto(["FIN: Eduardo muerto, Knox es de la banda"])
  fin_fin_reconquista(["FIN: Knox vuelve a ser luz de esperanza"])
  fin_hija_cabo_muerta(["Valentina muere"])
  fin_hija_cabo_salvada(["Valentina vuelve con el Cabo"])
  fin_lucia_en_riverside(["Lucia vuelve a Riverside"])
  fin_sous_caidos(["Sous cae en su base"])
  fin_sous_conquistada(["La base de Sous es de Maulen"])
  fin_sous_eliminado(["Sous eliminado"])
  fin_sous_maulen_escapa(["Maulen escapa con todo"])
  fin_sous_negado(["Le dices que no a Sous"])
  bandido_1 -->|final_cumplido, final_perdonado: bandido_cap = 1| bandido_2
  bandido_2 -->|final_cumplido, final_saboteado: bandido_cap = 2| bandido_3
  bandido_2 -->|final_saboteado: bandido_sospecha| bandido_castigo
  bandido_3 -->|final_cumplido, final_saboteado: bandido_cap = 3| bandido_4
  bandido_3 -->|final_saboteado: bandido_sospecha| bandido_castigo
  bandido_4 -->|final_cumplido, final_saboteado: bandido_cap = 4| bandido_5
  bandido_4 -->|final_saboteado: bandido_sospecha| bandido_castigo
  bandido_5 -->|final_con_pereira: bandido = pereira| conquista_muldraugh
  bandido_5 -->|final_con_pereira: bandido = pereira| conquista_sous
  cap_cabo_2 -->|final_cumplido, final_muerta: historia_muldraugh_2| hija_cabo
  cap_chela_2 -->|final_cumplido: historia_westpoint_2| leyenda_tomas
  cap_nacho_2 -->|final_cumplido: historia_riverside_2| cap_nacho_3
  cap_rosa_2 -->|final_cumplido, final_muerto: historia_rosewood_2| cap_rosa_3
  conquista_muldraugh -->|final_conquistado: conquista_muldraugh| conquista_riverside
  conquista_muldraugh -->|final_conquistado: conquista_muldraugh| conquista_rosewood
  conquista_muldraugh -->|final_conquistado: conquista_muldraugh| conquista_westpoint
  conquista_riverside -->|knox_conquistado| eduardo_atentado
  conquista_rosewood -->|knox_conquistado| eduardo_atentado
  conquista_westpoint -->|knox_conquistado| eduardo_atentado
  desbloqueo_muldraugh -->|final_campamento: historia_muldraugh_1| cap_cabo_2
  desbloqueo_riverside -->|final_campamento: historia_riverside_1| cap_nacho_2
  desbloqueo_rosewood -->|final_campamento: historia_rosewood_1| cap_rosa_2
  desbloqueo_westpoint -->|final_campamento: historia_westpoint_1| cap_chela_2
  eduardo_atentado -->|nota: eduardo_nota = true| eduardo_fallas
  eduardo_evento -->|caido_tomas| tomas_vuelve
  eduardo_fallas -->|final_reconquista: reconquista = true| reconquista_muldraugh
  eduardo_fallas -->|final_reconquista: reconquista = true| reconquista_riverside
  eduardo_fallas -->|final_reconquista: reconquista = true| reconquista_rosewood
  eduardo_fallas -->|final_reconquista: reconquista = true| reconquista_westpoint
  familia_infectada -->|final_abandonados: abre| sous
  familia_infectada -->|final_engano: abre| sous
  familia_infectada -->|final_era_gripe: abre| sous
  familia_infectada -->|final_falso_remedio: abre| sous
  familia_infectada -->|final_masacre: abre| sous
  familia_infectada -->|final_muertos: abre| sous
  familia_infectada -->|final_olvidados: abre| sous
  familia_infectada -->|final_salvados: abre| sous
  familia_infectada -->|final_se_curo_solo: abre| sous
  familia_infectada -->|final_transformado: abre| sous
  leyenda_tomas -->|caido, despedida: tomas_conocido| eduardo_evento
  leyenda_tomas -->|caido_tomas| tomas_vuelve
  reconquista_muldraugh -->|final_reconquistado: reconquista_muldraugh| reconquista_patio
  reconquista_riverside -->|final_reconquistado: reconquista_riverside| reconquista_patio
  reconquista_rosewood -->|final_reconquistado: reconquista_rosewood| reconquista_patio
  reconquista_westpoint -->|final_reconquistado: reconquista_westpoint| reconquista_patio
  sous -->|perdonado: maulen_salvado| bandido_maulen
  sous -->|final_aliados, final_mentira: sous = aliados| cal_amigo_secreto
  sous -->|final_aliados, final_mentira: sous = aliados| cal_fonda
  sous -->|final_aliados, final_mentira: sous = aliados| conquista_sous
  sous -->|perdonado: maulen_salvado| conquista_sous
  sous -->|final_aliados, final_mentira: sous = aliados| favor_bastian
  sous -->|final_aliados, final_mentira: sous = aliados| favor_benjamin
  sous -->|final_aliados, final_mentira: sous = aliados| favor_cristian
  sous -->|final_aliados, final_mentira: sous = aliados| favor_cristobal
  sous -->|final_aliados, final_mentira: sous = aliados| favor_david
  sous -->|final_aliados, final_mentira: sous = aliados| favor_hanz
  sous -->|final_aliados, final_mentira: sous = aliados| favor_jorge
  sous -->|final_aliados, final_mentira: sous = aliados| favor_martin_a
  sous -->|final_aliados, final_mentira: sous = aliados| favor_martin_z
  sous -->|final_aliados: abre| sous_arsenal
  sous -->|final_mentira: abre| sous_arsenal
  sous -->|final_te_quedaste: abre| sous_guerra
  sous -->|final_traicion: abre| sous_guerra
  sous_guerra -->|final_sous_eliminado: abre| sous_arsenal
  bandido_1 -.->|final_rechazo| fin_bandido_rechazado
  bandido_5 -.->|final_escapo| fin_bandido_pereira_escapo
  bandido_5 -.->|final_redencion| fin_bandido_redimido
  bandido_maulen -.->|final_rechazo| fin_bandido_rechazado
  cap_nacho_3 -.->|final_cumplido| fin_lucia_en_riverside
  cap_rosa_3 -.->|final_cumplido| fin_estanque_rosewood_defendido
  conquista_sous -.->|final_conquistado| fin_sous_conquistada
  eduardo_fallas -.->|final_eduardo_muerto| fin_fin_eduardo_muerto
  hija_cabo -.->|final_perdida| fin_hija_cabo_muerta
  hija_cabo -.->|final_reencuentro| fin_hija_cabo_salvada
  reconquista_patio -.->|final_luz| fin_fin_reconquista
  sous -.->|final_sous_caidos| fin_sous_caidos
  sous -.->|final_maulen_escapa| fin_sous_maulen_escapa
  sous -.->|final_negado| fin_sous_negado
  sous_guerra -.->|final_sous_eliminado| fin_sous_eliminado
```

## Decisiones

Las historias con mas de un final: que eleccion lleva a cada uno y que deja.

### El alijo (`alijo_custodiado`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_encontrado` | (sin eleccion: pasa solo) | `alijo` = encontrado | - |
| `final_perdido` | (sin eleccion: pasa solo) | - | - |

### Asalto al refugio (`asalto_nocturno`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_rechazado` | (sin eleccion: pasa solo) | `asalto` = rechazado | - |
| `final_se_retiraron` | (sin eleccion: pasa solo) | - | - |

### El camino del bandido: el traidor (`bandido_1`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Que necesitas?" | `bandido_ultimo` = abandonado | - |
| `final_cumplido` | "Dejarlo ir. Pedirle su placa como prueba" | `bandido_cap` = 1, `bandido_ultimo` = hecho | bandido_2 |
| `final_perdonado` | "Dejarlo ir. Pedirle su placa como prueba" | `bandido_cap` = 1, `bandido_ultimo` = hecho | bandido_2 |
| `final_rechazo` | "No trabajo para nadie" | `bandido` = rechazado | Rechaza a la banda (la puerta queda abierta) |

### El camino del bandido: la comisaria (`bandido_2`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Voy esta noche" | `bandido_ultimo` = abandonado | - |
| `final_cumplido` | "Avisarle al Cabo lo que quiere {jefe_corto}" | `bandido_cap` = 2, `bandido_ultimo` = hecho | bandido_3 |
| `final_saboteado` | "Avisarle al Cabo lo que quiere {jefe_corto}" | `bandido_cap` = 2, `bandido_sospecha` = ?, `bandido_ultimo` = hecho | bandido_3, bandido_castigo |

### El camino del bandido: la familia (`bandido_3`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Entendido" | `bandido_ultimo` = abandonado | - |
| `final_cumplido` | "Decirles que huyan esta noche. Pedirles algo para enganar a {jefe_corto}" | `bandido_cap` = 3, `bandido_ultimo` = hecho | bandido_4 |
| `final_saboteado` | "Decirles que huyan esta noche. Pedirles algo para enganar a {jefe_corto}" | `bandido_cap` = 3, `bandido_sospecha` = ?, `bandido_ultimo` = hecho | bandido_4, bandido_castigo |

### El camino del bandido: las latas (`bandido_4`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Todas" | `bandido_ultimo` = abandonado | - |
| `final_cumplido` | "Llevarte la mitad y decirles que escondan el resto"<br>"Quitarles todo" | `bandido_cap` = 4, `bandido_ultimo` = hecho | bandido_5 |
| `final_saboteado` | "Llevarte la mitad y decirles que escondan el resto"<br>"Quitarles todo" | `bandido_cap` = 4, `bandido_sospecha` = ?, `bandido_ultimo` = hecho | bandido_5, bandido_castigo |

### El camino del bandido: la decision (`bandido_5`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Irte en silencio. Esto se termina, pero no como ella quiere" | `bandido_ultimo` = abandonado | - |
| `final_con_pereira` | "A tu derecha, {jefe_corto}" | `bandido_cap` = 5, `bandido_ultimo` = hecho, `bandido` = pereira | conquista_muldraugh, conquista_sous |
| `final_escapo` | "Irte en silencio. Esto se termina, pero no como ella quiere" | `bandido_cap` = 5, `bandido_ultimo` = hecho, `bandido` = pereira_escapo | El jefe del patio escapa |
| `final_redencion` | "Irte en silencio. Esto se termina, pero no como ella quiere" | `bandido_cap` = 5, `bandido_ultimo` = hecho, `bandido` = redimido | Redencion: Knox vuelve a 0 |

### El camino del bandido: Maulen (`bandido_maulen`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | `bandido_ultimo` = abandonado | - |
| `final_rechazo` | "Te deje vivir. No te debo nada mas" | `bandido` = rechazado | Rechaza a la banda (la puerta queda abierta) |
| `final_unido` | "Que necesitas, Maulen?" | `bandido_ultimo` = hecho | - |

### El amigo secreto de Sous (`cal_amigo_secreto`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_regalo` | "Darle el regalo a {amigo_nombre}" | - | - |
| `final_sin_regalo` | (sin eleccion: pasa solo) | - | - |

### La fonda de Sous (`cal_fonda`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_fonda` | "Entregar la carne y el carbon para la fonda" | `cal.fonda` = hecha | - |
| `final_sin_fonda` | (sin eleccion: pasa solo) | `cal.fonda` = sin | - |

### La puerta de atras (`cap_cabo_2`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_cumplido` | "Llevarla donde el Cabo" | `historia_muldraugh_2` = true | hija_cabo |
| `final_muerta` | "Llevarla donde el Cabo" | `historia_muldraugh_2` = fallido | hija_cabo |

### La muchacha que esperaba (`cap_nacho_3`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_cumplido` | "Decirle que el Padre la espera y que ya no se va" | `historia_riverside_3` = true, `lucia` = en_riverside | Lucia vuelve a Riverside |
| `final_muerta` | "Decirle que el Padre la espera y que ya no se va" | `historia_riverside_3` = fallido, `lucia` = muerta | - |

### La ruta 31 (`cap_rosa_2`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_cumplido` | "Entregarle la carga del Gordo Earl" | `historia_rosewood_2` = true | cap_rosa_3 |
| `final_muerto` | (sin eleccion: pasa solo) | `historia_rosewood_2` = fallido | cap_rosa_3 |

### La conquista: la comisaria del Cabo Ramiro (`conquista_muldraugh`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_conquistado` | (sin eleccion: pasa solo) | `conquista_muldraugh` = true | conquista_riverside, conquista_rosewood, conquista_westpoint |

### La conquista: la iglesia del Padre Nacho (`conquista_riverside`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_conquistado` | (sin eleccion: pasa solo) | `conquista_riverside` = true | - |

### La conquista: la bencinera de la Misia Rosa (`conquista_rosewood`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_conquistado` | (sin eleccion: pasa solo) | `conquista_rosewood` = true | - |

### La conquista: la base de Sous (`conquista_sous`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_conquistado` | (sin eleccion: pasa solo) | `conquista_sous` = true, `sous` = conquistada | La base de Sous es de Maulen |

### La conquista: el cuartel de la Tia Chela (`conquista_westpoint`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_conquistado` | (sin eleccion: pasa solo) | `conquista_westpoint` = true | - |

### Eduardo, corriendo (`eduardo_evento`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | "Esconderte y dejar que el se encargue"<br>"Pelear junto a Eduardo" | - | - |
| `final_cayo` | "Esconderte y dejar que el se encargue"<br>"Pelear junto a Eduardo" | - | - |
| `final_escondido` | "Esconderte y dejar que el se encargue" | - | - |
| `final_ganado` | "Pelear junto a Eduardo" | - | - |
| `final_nada` | (sin eleccion: pasa solo) | - | - |

### Fallas Lake (`eduardo_fallas`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_eduardo_muerto` | "Vengo a terminar esto" | `fin` = eduardo_muerto, `tomas_muerto` = true | FIN: Eduardo muerto, Knox es de la banda |
| `final_reconquista` | "Vengo a hablar. Quiero devolverle Knox a la gente" | `reconquista` = true | reconquista_muldraugh, reconquista_riverside, reconquista_rosewood, reconquista_westpoint |

### El desertor (`el_desertor`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_capturado` | "Esconderlo en el refugio" | `desertor` = muerto | - |
| `final_echado` | "Decirle que se vaya" | `desertor` = echado | - |
| `final_entregado` | "Entregarlo a los soldados" | `desertor` = entregado | - |
| `final_lo_mataste` | "Esconderlo en el refugio" | `desertor` = asesinado | - |
| `final_protegido` | "Esconderlo en el refugio" | `desertor` = protegido | - |
| `final_se_rindieron` | "Esconderlo en el refugio" | `desertor` = protegido | - |
| `final_siguio_de_largo` | (sin eleccion: pasa solo) | - | - |

### Los Bell (`familia_infectada`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonados` | "Decirles que se vayan" | `bell` = abandonados | sous |
| `final_engano` | "Darles la pastilla verdadera (Medicina 4+)"<br>"Darles una de las pastillas K-93 (cualquiera)"<br>"Darles una falsa y quedarte con la verdadera (Medicina 4+)"<br>"Dejarlos quedarse en el refugio" | `bell_culpa` = true, `bell` = enganados | sous |
| `final_era_gripe` | "Darles la pastilla verdadera (Medicina 4+)"<br>"Darles una de las pastillas K-93 (cualquiera)"<br>"Darles una falsa y quedarte con la verdadera (Medicina 4+)"<br>"Dejarlos quedarse en el refugio" | `bell` = era_gripe | sous |
| `final_falso_remedio` | "Darles la pastilla verdadera (Medicina 4+)"<br>"Darles una de las pastillas K-93 (cualquiera)"<br>"Darles una falsa y quedarte con la verdadera (Medicina 4+)"<br>"Dejarlos quedarse en el refugio" | `bell` = falso_remedio, `curandero_falso` = true | sous |
| `final_masacre` | "Dejarlos quedarse en el refugio" | `bell` = masacre | sous |
| `final_muertos` | "Dejarlos quedarse en el refugio" | `bell` = muertos | sous |
| `final_olvidados` | (sin eleccion: pasa solo) | `bell` = olvidados | sous |
| `final_salvados` | "Darles la pastilla verdadera (Medicina 4+)"<br>"Darles una de las pastillas K-93 (cualquiera)"<br>"Darles una falsa y quedarte con la verdadera (Medicina 4+)"<br>"Dejarlos quedarse en el refugio" | `bell` = salvados | sous |
| `final_se_curo_solo` | "Dejarlos quedarse en el refugio" | `bell` = se_curo_solo | sous |
| `final_transformado` | "Dejarlos quedarse en el refugio" | `bell` = transformado | sous |

### Favor de Tati (`favor_bastian`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle el collar de plata a Tati" | `favor_bastian` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_bastian` = murio | - |

### Favor de Matric (`favor_benjamin`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Mostrarle a Matric que encontraste la Mata Perras" | `favor_benjamin` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_benjamin` = murio | - |

### Favor de Cristonks (`favor_cristian`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle las antiparras a Cristonks" | `favor_cristian` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_cristian` = murio | - |

### Favor de Wertres (`favor_cristobal`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle la camiseta del Bicho a Wertres" | `favor_cristobal` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_cristobal` = murio | - |

### Favor de Shinbo (`favor_david`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle la foto de Sous a Shinbo" | `favor_david` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_david` = murio | - |

### Favor de Walita (`favor_hanz`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle el tallado a Walita" | `favor_hanz` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_hanz` = murio | - |

### Favor de Hasag (`favor_jorge`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle el libro de cuentas a Hasag" | `favor_jorge` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_jorge` = murio | - |

### Favor de Akagami (`favor_martin_a`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Devolverle la pelota firmada a Akagami" | `favor_martin_a` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_martin_a` = murio | - |

### Favor de Zent (`favor_martin_z`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_hecho` | "Mostrarle a Zent que encontraste su cuchillo" | `favor_martin_z` = hecho | - |
| `final_murio` | (sin eleccion: pasa solo) | `favor_martin_z` = murio | - |

### Valentina (`hija_cabo`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_perdida` | "Te manda tu papa. El Cabo Ramiro esta vivo." | `hija_cabo` = muerta, `historia_muldraugh_3` = fallido | Valentina muere |
| `final_reencuentro` | "Te manda tu papa. El Cabo Ramiro esta vivo." | `hija_cabo` = salvada, `historia_muldraugh_3` = true | Valentina vuelve con el Cabo |

### El hijo perdido (`hijo_perdido`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_lo_encontraste_tarde` | (sin eleccion: pasa solo) | `lucas` = transformado | - |
| `final_lo_perdiste` | (sin eleccion: pasa solo) | `lucas` = muerto | - |
| `final_reunidos` | (sin eleccion: pasa solo) | `lucas` = rescatado | - |
| `final_tarde` | (sin eleccion: pasa solo) | - | - |
| `final_tragedia` | (sin eleccion: pasa solo) | `lucas` = asesinado | - |

### Un cientifico que dice tener la cura (`leyenda_tomas`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_cumplido` | "Giovanns... Eduardo? Tu mama, la Tia Chela, te espera en el cuartel de West Point."<br>"No decirle nada" | `cientifico_hartmann` = en_west_point, `historia_westpoint_3` = true | - |
| `final_muerto` | "Giovanns... Eduardo? Tu mama, la Tia Chela, te espera en el cuartel de West Point."<br>"No decirle nada" | `cientifico_hartmann` = muerto, `historia_westpoint_3` = true | - |

### La reconquista: la comisaria de Muldraugh (`reconquista_muldraugh`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_reconquistado` | (sin eleccion: pasa solo) | `reconquista_muldraugh` = true | reconquista_patio |

### La reconquista: la iglesia de Riverside (`reconquista_riverside`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_reconquistado` | (sin eleccion: pasa solo) | `reconquista_riverside` = true | reconquista_patio |

### La reconquista: la bencinera de Rosewood (`reconquista_rosewood`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_reconquistado` | (sin eleccion: pasa solo) | `reconquista_rosewood` = true | reconquista_patio |

### La reconquista: el cuartel de West Point (`reconquista_westpoint`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_abandonado` | (sin eleccion: pasa solo) | - | - |
| `final_reconquistado` | (sin eleccion: pasa solo) | `reconquista_westpoint` = true | reconquista_patio |

### Gritos de auxilio (`sobreviviente_acorralada`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_muerta` | (sin eleccion: pasa solo) | `denise` = muerta | - |
| `final_rescatada` | (sin eleccion: pasa solo) | `denise` = rescatada | - |
| `final_tarde` | (sin eleccion: pasa solo) | - | - |
| `final_traicion` | (sin eleccion: pasa solo) | `denise` = asesinada | - |

### Sous (`sous`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_aliados` | "Decidir devolverle las cosas a Sous"<br>"Dejarlo ir. Sous va a creer que se escapo"<br>"Entregar los suministros a Sous" | `sous` = aliados | cal_amigo_secreto, cal_fonda, conquista_sous, favor_bastian, favor_benjamin, favor_cristian, favor_cristobal, favor_david, favor_hanz, favor_jorge, favor_martin_a, favor_martin_z, sous_arsenal |
| `final_maulen_escapa` | "Ir con Akagami, Zent y Walita"<br>"Ir con Matric, Tati y David Shinbo"<br>"Ir con Tati, Shinbo y Zent"<br>"Ir con Wertres y David Shinbo"<br>"Ir con todo Sous"<br>"Mejor ir solo"<br>"Revisar el deposito saqueado" | `sous` = maulen_escapa | Maulen escapa con todo |
| `final_mentira` | "Dejarlo ir. Sous va a creer que se escapo"<br>"Ir con Akagami, Zent y Walita"<br>"Ir con Matric, Tati y David Shinbo"<br>"Ir con Tati, Shinbo y Zent"<br>"Ir con Wertres y David Shinbo"<br>"Ir con todo Sous"<br>"Mejor ir solo"<br>"Quedarte con todo lo que robo Maulen" | `sous_mentira` = true, `sous` = aliados | cal_amigo_secreto, cal_fonda, conquista_sous, favor_bastian, favor_benjamin, favor_cristian, favor_cristobal, favor_david, favor_hanz, favor_jorge, favor_martin_a, favor_martin_z, sous_arsenal |
| `final_negado` | "Decir que no es tu problema"<br>"Entregar la medicina"<br>"Ofrecer tu ayuda a Sous" | `sous` = negado | Le dices que no a Sous |
| `final_nunca_fuiste` | (sin eleccion: pasa solo) | `sous` = ignorados | - |
| `final_sous_caidos` | "Entregar las armas" | `sous` = caidos | Sous cae en su base |
| `final_te_quedaste` | "Decidir devolverle las cosas a Sous"<br>"Dejarlo ir. Sous va a creer que se escapo"<br>"Ir con Akagami, Zent y Walita"<br>"Ir con Matric, Tati y David Shinbo"<br>"Ir con Tati, Shinbo y Zent"<br>"Ir con Wertres y David Shinbo"<br>"Ir con todo Sous"<br>"Mejor ir solo"<br>"Quedarte con todo lo que robo Maulen" | `sous` = enemigos | sous_guerra |
| `final_traicion` | "Decidir devolverle las cosas a Sous"<br>"Dejarlo ir. Sous va a creer que se escapo"<br>"Entregar la medicina"<br>"Entregar las armas"<br>"Ir con Akagami, Zent y Walita"<br>"Ir con Matric, Tati y David Shinbo"<br>"Ir con Tati, Shinbo y Zent"<br>"Ir con Wertres y David Shinbo"<br>"Ir con todo Sous"<br>"Mejor ir solo"<br>"Ofrecer tu ayuda a Sous" | `sous` = enemigos | sous_guerra |

### El arsenal (`sous_arsenal`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_arma` | "Sacar el arma legendaria" | `arsenal` = arma | - |
| `final_auto` | "Quedarte con las llaves del auto legendario" | `arsenal` = auto | - |
| `final_saqueado` | (sin eleccion: pasa solo) | - | - |
| `final_traje` | "Sacar el traje legendario" | `arsenal` = traje | - |

### El trueque (`trueque_trampa`)

| Final | Se llega eligiendo | Deja | Lleva a |
| --- | --- | --- | --- |
| `final_escapaste` | (sin eleccion: pasa solo) | - | - |
| `final_ganada` | (sin eleccion: pasa solo) | `trueque` = ganado | - |
| `final_ignorado` | (sin eleccion: pasa solo) | - | - |

## Historias

| Historia | Id | Como se lanza | Pide | Deja (memoria = valor, en que final) |
| --- | --- | --- | --- | --- |
| El alijo | `alijo_custodiado` | el director (al azar, segun tension) | - | `alijo` = encontrado (final_encontrado) |
| Asalto al refugio | `asalto_nocturno` | el director (al azar, segun tension) | - | `asalto` = rechazado (final_rechazado) |
| El camino del bandido: el traidor | `bandido_1` | Knox llega a -5 (NarradorBandido) | `knox_bandido_<grupo>` | `bandido` = rechazado (final_rechazo)<br>`bandido_cap` = 1 (final_cumplido)<br>`bandido_cap` = 1 (final_perdonado)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_cumplido)<br>`bandido_ultimo` = hecho (final_perdonado)<br>`julio_vivo` = true (huida) |
| El camino del bandido: la comisaria | `bandido_2` | volver al patio de trenes (NarradorBandido) | `bandido_cap = 1` | `bandido_cap` = 2 (final_cumplido)<br>`bandido_cap` = 2 (final_saboteado)<br>`bandido_sospecha` = ? (final_saboteado)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_cumplido)<br>`bandido_ultimo` = hecho (final_saboteado) |
| El camino del bandido: la familia | `bandido_3` | volver al patio de trenes (NarradorBandido) | `bandido_cap = 2` | `bandido_cap` = 3 (final_cumplido)<br>`bandido_cap` = 3 (final_saboteado)<br>`bandido_sospecha` = ? (final_saboteado)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_cumplido)<br>`bandido_ultimo` = hecho (final_saboteado) |
| El camino del bandido: las latas | `bandido_4` | volver al patio de trenes (NarradorBandido) | `bandido_cap = 3` | `bandido_cap` = 4 (final_cumplido)<br>`bandido_cap` = 4 (final_saboteado)<br>`bandido_sospecha` = ? (final_saboteado)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_cumplido)<br>`bandido_ultimo` = hecho (final_saboteado) |
| El camino del bandido: la decision | `bandido_5` | volver al patio de trenes (NarradorBandido) | `bandido_cap = 4`, `julio_vivo`, `tomas_conocido` | `bandido` = pereira (final_con_pereira)<br>`bandido` = pereira_escapo (final_escapo)<br>`bandido` = redimido (final_redencion)<br>`bandido_cap` = 5 (final_con_pereira)<br>`bandido_cap` = 5 (final_escapo)<br>`bandido_cap` = 5 (final_redencion)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_con_pereira)<br>`bandido_ultimo` = hecho (final_escapo)<br>`bandido_ultimo` = hecho (final_redencion) |
| Bandido: el jefe descubre el sabotaje | `bandido_castigo` | al volver al patio, 30% por sabotaje (NarradorBandido) | `bandido_sospecha` | `pereira_desconfia` = true (final_sobreviviste) |
| El camino del bandido: Maulen | `bandido_maulen` | 72 horas despues de perdonar a Maulen (NarradorBandido) | `maulen_salvado` | `bandido` = rechazado (final_rechazo)<br>`bandido_ultimo` = abandonado (final_abandonado)<br>`bandido_ultimo` = hecho (final_unido) |
| El amigo secreto de Sous | `cal_amigo_secreto` | 24 de diciembre, con Sous aliado (NarradorCalendario) | `sous = aliados` | - |
| La fonda de Sous | `cal_fonda` | 18 de septiembre, con Sous aliado (NarradorCalendario) | `sous = aliados` | `cal.fonda` = hecha (final_fonda)<br>`cal.fonda` = sin (final_sin_fonda) |
| La puerta de atras | `cap_cabo_2` | capitulo 2 de muldraugh, entre sus ofertas | `historia_muldraugh_1` | `historia_muldraugh_2` = fallido (final_muerta)<br>`historia_muldraugh_2` = true (final_cumplido) |
| La radio del cuartel | `cap_chela_2` | capitulo 2 de westpoint, entre sus ofertas | `historia_westpoint_1` | `historia_westpoint_2` = true (final_cumplido)<br>`radio_westpoint` = true (final_cumplido) |
| El ring de Lexington | `cap_nacho_2` | capitulo 2 de riverside, entre sus ofertas | `historia_riverside_1` | `historia_riverside_2` = true (final_cumplido) |
| La muchacha que esperaba | `cap_nacho_3` | capitulo 3 de riverside, entre sus ofertas | `historia_riverside_2` | `historia_riverside_3` = fallido (final_muerta)<br>`historia_riverside_3` = true (final_cumplido)<br>`lucia` = en_riverside (final_cumplido)<br>`lucia` = muerta (final_muerta) |
| La ruta 31 | `cap_rosa_2` | capitulo 2 de rosewood, entre sus ofertas | `historia_rosewood_1` | `historia_rosewood_2` = fallido (final_muerto)<br>`historia_rosewood_2` = true (final_cumplido) |
| El estanque | `cap_rosa_3` | capitulo 3 de rosewood, entre sus ofertas | `historia_rosewood_2` | `estanque_rosewood` = defendido (final_cumplido)<br>`historia_rosewood_3` = true (final_cumplido) |
| La conquista: la comisaria del Cabo Ramiro | `conquista_muldraugh` | despues del cap. 5 con el jefe (NarradorBandido) | `bandido = pereira`, `misionero_muerto_muldraugh` | `conquista_muldraugh` = true (final_conquistado) |
| La conquista: la iglesia del Padre Nacho | `conquista_riverside` | al entrar a Riverside (NarradorBandido) | `conquista_muldraugh`, `misionero_muerto_riverside` | `conquista_riverside` = true (final_conquistado) |
| La conquista: la bencinera de la Misia Rosa | `conquista_rosewood` | al entrar a Rosewood (NarradorBandido) | `conquista_muldraugh`, `misionero_muerto_rosewood` | `conquista_rosewood` = true (final_conquistado) |
| La conquista: la base de Sous | `conquista_sous` | con Maulen de jefe y Sous aliado (NarradorBandido) | `bandido = pereira`, `maulen_salvado`, `sous = aliados` | `conquista_sous` = true (final_conquistado)<br>`sous` = conquistada (final_conquistado) |
| La conquista: el cuartel de la Tia Chela | `conquista_westpoint` | al entrar a West Point (NarradorBandido) | `conquista_muldraugh`, `misionero_muerto_westpoint` | `conquista_westpoint` = true (final_conquistado) |
| Cabo Ramiro quiere un campamento | `desbloqueo_muldraugh` | al andar por Muldraugh (NarradorContactos) | - | `campamento_muldraugh` = fundado (final_campamento)<br>`historia_muldraugh_1` = true (final_campamento) |
| Padre Nacho quiere un campamento | `desbloqueo_riverside` | al andar por Riverside (NarradorContactos) | - | `campamento_riverside` = fundado (final_campamento)<br>`historia_riverside_1` = true (final_campamento) |
| Misia Rosa quiere un campamento | `desbloqueo_rosewood` | al andar por Rosewood (NarradorContactos) | - | `campamento_rosewood` = fundado (final_campamento)<br>`historia_rosewood_1` = true (final_campamento) |
| Tia Chela quiere un campamento | `desbloqueo_westpoint` | al andar por West Point (NarradorContactos) | - | `campamento_westpoint` = fundado (final_campamento)<br>`historia_westpoint_1` = true (final_campamento) |
| Eduardo viene por ti | `eduardo_atentado` | 3 veces, cada 48 horas (NarradorBandido) | `knox_conquistado` | `eduardo_nota` = true (nota) |
| Eduardo, corriendo | `eduardo_evento` | tirada diaria (NarradorEduardo) | `tomas_conocido` | - |
| Fallas Lake | `eduardo_fallas` | despues del tercer atentado (NarradorBandido) | `eduardo_nota = true` | `fin` = eduardo_muerto (final_eduardo_muerto)<br>`reconquista` = true (final_reconquista)<br>`tomas_muerto` = true (final_eduardo_muerto) |
| El desertor | `el_desertor` | el director (al azar, segun tension) | - | `desertor` = asesinado (final_lo_mataste)<br>`desertor` = echado (final_echado)<br>`desertor` = entregado (final_entregado)<br>`desertor` = muerto (final_capturado)<br>`desertor` = protegido (final_protegido)<br>`desertor` = protegido (final_se_rindieron) |
| Los Bell | `familia_infectada` | el director (al azar, segun tension) | - | `bell` = abandonados (final_abandonados)<br>`bell` = enganados (final_engano)<br>`bell` = era_gripe (final_era_gripe)<br>`bell` = falso_remedio (final_falso_remedio)<br>`bell` = masacre (final_masacre)<br>`bell` = muertos (final_muertos)<br>`bell` = olvidados (final_olvidados)<br>`bell` = salvados (final_salvados)<br>`bell` = se_curo_solo (final_se_curo_solo)<br>`bell` = transformado (final_transformado)<br>`bell_culpa` = true (final_engano)<br>`curandero_falso` = true (final_falso_remedio) |
| Favor de Tati | `favor_bastian` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_bastian` = hecho (final_hecho)<br>`favor_bastian` = murio (final_murio) |
| Favor de Matric | `favor_benjamin` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_benjamin` = hecho (final_hecho)<br>`favor_benjamin` = murio (final_murio) |
| Favor de Cristonks | `favor_cristian` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_cristian` = hecho (final_hecho)<br>`favor_cristian` = murio (final_murio) |
| Favor de Wertres | `favor_cristobal` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_cristobal` = hecho (final_hecho)<br>`favor_cristobal` = murio (final_murio) |
| Favor de Shinbo | `favor_david` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_david` = hecho (final_hecho)<br>`favor_david` = murio (final_murio) |
| Favor de Walita | `favor_hanz` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_hanz` = hecho (final_hecho)<br>`favor_hanz` = murio (final_murio) |
| Favor de Hasag | `favor_jorge` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_jorge` = hecho (final_hecho)<br>`favor_jorge` = murio (final_murio) |
| Favor de Akagami | `favor_martin_a` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_martin_a` = hecho (final_hecho)<br>`favor_martin_a` = murio (final_murio) |
| Favor de Zent | `favor_martin_z` | pedirle el favor en la base de Sous (FavoresSous) | `sous = aliados` | `favor_martin_z` = hecho (final_hecho)<br>`favor_martin_z` = murio (final_murio) |
| Valentina | `hija_cabo` | capitulo 3 de muldraugh, entre sus ofertas | `historia_muldraugh_2` | `hija_cabo` = muerta (final_perdida)<br>`hija_cabo` = salvada (final_reencuentro)<br>`historia_muldraugh_3` = fallido (final_perdida)<br>`historia_muldraugh_3` = true (final_reencuentro) |
| El hijo perdido | `hijo_perdido` | el director (al azar, segun tension) | - | `lucas` = asesinado (final_tragedia)<br>`lucas` = muerto (final_lo_perdiste)<br>`lucas` = rescatado (final_reunidos)<br>`lucas` = transformado (final_lo_encontraste_tarde) |
| Horda en camino | `horda_en_camino` | el director (al azar, segun tension) | - | - |
| Un cientifico que dice tener la cura | `leyenda_tomas` | capitulo 3 de westpoint, entre sus ofertas | `historia_westpoint_2` | `cientifico_hartmann` = en_west_point (final_cumplido)<br>`cientifico_hartmann` = muerto (final_muerto)<br>`historia_westpoint_3` = true (final_cumplido)<br>`historia_westpoint_3` = true (final_muerto)<br>`tomas_conocido` = true (caido)<br>`tomas_conocido` = true (despedida) |
| La reconquista: la comisaria de Muldraugh | `reconquista_muldraugh` | al entrar a Muldraugh (NarradorBandido) | `misionero_muerto_muldraugh`, `reconquista = true` | `reconquista_muldraugh` = true (final_reconquistado) |
| La reconquista: el patio de trenes | `reconquista_patio` | con las 4 ciudades reconquistadas (NarradorBandido) | `reconquista_muldraugh`, `reconquista_riverside`, `reconquista_rosewood`, `reconquista_westpoint` | `fin` = reconquista (final_luz) |
| La reconquista: la iglesia de Riverside | `reconquista_riverside` | al entrar a Riverside (NarradorBandido) | `misionero_muerto_riverside`, `reconquista = true` | `reconquista_riverside` = true (final_reconquistado) |
| La reconquista: la bencinera de Rosewood | `reconquista_rosewood` | al entrar a Rosewood (NarradorBandido) | `misionero_muerto_rosewood`, `reconquista = true` | `reconquista_rosewood` = true (final_reconquistado) |
| La reconquista: el cuartel de West Point | `reconquista_westpoint` | al entrar a West Point (NarradorBandido) | `misionero_muerto_westpoint`, `reconquista = true` | `reconquista_westpoint` = true (final_reconquistado) |
| Gritos de auxilio | `sobreviviente_acorralada` | el director (al azar, segun tension) | - | `denise` = asesinada (final_traicion)<br>`denise` = muerta (final_muerta)<br>`denise` = rescatada (final_rescatada) |
| Sous | `sous` | lo abre familia_infectada | `bell` | `maulen_salvado` = true (perdonado)<br>`sous` = aliados (final_aliados)<br>`sous` = aliados (final_mentira)<br>`sous` = caidos (final_sous_caidos)<br>`sous` = enemigos (final_te_quedaste)<br>`sous` = enemigos (final_traicion)<br>`sous` = ignorados (final_nunca_fuiste)<br>`sous` = maulen_escapa (final_maulen_escapa)<br>`sous` = negado (final_negado)<br>`sous_mentira` = true (final_mentira) |
| El arsenal | `sous_arsenal` | lo abre sous, sous_guerra | `sous`, `sous_lider`, `sous_lider_nombre`, `sous_lider_perfil` | `arsenal` = arma (final_arma)<br>`arsenal` = auto (final_auto)<br>`arsenal` = traje (final_traje) |
| La guerra con Sous | `sous_guerra` | lo abre sous | - | `sous` = eliminado (final_sous_eliminado) |
| Eduardo, otra vez | `tomas_vuelve` | al pasar por el cuartel de la Chela (NarradorContactos) | `caido_tomas` | `tomas_vivo` = true (final) |
| El trueque | `trueque_trampa` | el director (al azar, segun tension) | - | `trueque` = ganado (final_ganada) |

## Memorias

| Memoria | La dejan | La piden |
| --- | --- | --- |
| `alijo` | alijo_custodiado | - |
| `arsenal` | sous_arsenal | - |
| `asalto` | asalto_nocturno | - |
| `bandido` | bandido_1, bandido_5, bandido_maulen | conquista_muldraugh, conquista_sous |
| `bandido_cap` | bandido_1, bandido_2, bandido_3, bandido_4, bandido_5 | bandido_2, bandido_3, bandido_4, bandido_5 |
| `bandido_sospecha` | bandido_2, bandido_3, bandido_4 | bandido_castigo |
| `bandido_ultimo` | bandido_1, bandido_2, bandido_3, bandido_4, bandido_5, bandido_maulen | - |
| `bell` | familia_infectada | sous |
| `bell_culpa` | familia_infectada | - |
| `caido_tomas` | eduardo_evento, leyenda_tomas | tomas_vuelve |
| `cal.fonda` | cal_fonda | - |
| `campamento_muldraugh` | desbloqueo_muldraugh | - |
| `campamento_riverside` | desbloqueo_riverside | - |
| `campamento_rosewood` | desbloqueo_rosewood | - |
| `campamento_westpoint` | desbloqueo_westpoint | - |
| `cientifico_hartmann` | leyenda_tomas | - |
| `conquista_muldraugh` | conquista_muldraugh | conquista_riverside, conquista_rosewood, conquista_westpoint |
| `conquista_riverside` | conquista_riverside | - |
| `conquista_rosewood` | conquista_rosewood | - |
| `conquista_sous` | conquista_sous | - |
| `conquista_westpoint` | conquista_westpoint | - |
| `curandero_falso` | familia_infectada | - |
| `denise` | sobreviviente_acorralada | - |
| `desertor` | el_desertor | - |
| `eduardo_nota` | eduardo_atentado | eduardo_fallas |
| `estanque_rosewood` | cap_rosa_3 | - |
| `favor_bastian` | favor_bastian | - |
| `favor_benjamin` | favor_benjamin | - |
| `favor_cristian` | favor_cristian | - |
| `favor_cristobal` | favor_cristobal | - |
| `favor_david` | favor_david | - |
| `favor_hanz` | favor_hanz | - |
| `favor_jorge` | favor_jorge | - |
| `favor_martin_a` | favor_martin_a | - |
| `favor_martin_z` | favor_martin_z | - |
| `fin` | eduardo_fallas, reconquista_patio | - |
| `hija_cabo` | hija_cabo | - |
| `historia_muldraugh_1` | desbloqueo_muldraugh | cap_cabo_2 |
| `historia_muldraugh_2` | cap_cabo_2 | hija_cabo |
| `historia_muldraugh_3` | hija_cabo | - |
| `historia_riverside_1` | desbloqueo_riverside | cap_nacho_2 |
| `historia_riverside_2` | cap_nacho_2 | cap_nacho_3 |
| `historia_riverside_3` | cap_nacho_3 | - |
| `historia_rosewood_1` | desbloqueo_rosewood | cap_rosa_2 |
| `historia_rosewood_2` | cap_rosa_2 | cap_rosa_3 |
| `historia_rosewood_3` | cap_rosa_3 | - |
| `historia_westpoint_1` | desbloqueo_westpoint | cap_chela_2 |
| `historia_westpoint_2` | cap_chela_2 | leyenda_tomas |
| `historia_westpoint_3` | leyenda_tomas | - |
| `julio_vivo` | bandido_1 | bandido_5 |
| `knox_bandido_<grupo>` | - | bandido_1 |
| `knox_conquistado` | conquista_riverside, conquista_rosewood, conquista_westpoint | eduardo_atentado |
| `lucas` | hijo_perdido | - |
| `lucia` | cap_nacho_3 | - |
| `maulen_salvado` | sous | bandido_maulen, conquista_sous |
| `misionero_muerto_muldraugh` | - | conquista_muldraugh, reconquista_muldraugh |
| `misionero_muerto_riverside` | - | conquista_riverside, reconquista_riverside |
| `misionero_muerto_rosewood` | - | conquista_rosewood, reconquista_rosewood |
| `misionero_muerto_westpoint` | - | conquista_westpoint, reconquista_westpoint |
| `pereira_desconfia` | bandido_castigo | - |
| `radio_westpoint` | cap_chela_2 | - |
| `reconquista` | eduardo_fallas | reconquista_muldraugh, reconquista_riverside, reconquista_rosewood, reconquista_westpoint |
| `reconquista_muldraugh` | reconquista_muldraugh | reconquista_patio |
| `reconquista_riverside` | reconquista_riverside | reconquista_patio |
| `reconquista_rosewood` | reconquista_rosewood | reconquista_patio |
| `reconquista_westpoint` | reconquista_westpoint | reconquista_patio |
| `sous` | conquista_sous, sous, sous_guerra | cal_amigo_secreto, cal_fonda, conquista_sous, favor_bastian, favor_benjamin, favor_cristian, favor_cristobal, favor_david, favor_hanz, favor_jorge, favor_martin_a, favor_martin_z, sous_arsenal |
| `sous_lider` | - | sous_arsenal |
| `sous_lider_nombre` | - | sous_arsenal |
| `sous_lider_perfil` | - | sous_arsenal |
| `sous_mentira` | sous | - |
| `tomas_conocido` | leyenda_tomas | bandido_5, eduardo_evento |
| `tomas_muerto` | eduardo_fallas | - |
| `tomas_vivo` | tomas_vuelve | - |
| `trueque` | trueque_trampa | - |

Encargos que se repiten (no son trama): `enc`, `encargo`, `encargo_alijo`, `encargo_gen`, `encargo_medicina`, `encargo_paquete`, `encargo_planos`, `encargo_radio`, `encargo_rescate`, `encargo_ultra`, `inmoral`, `recado`.
