# Graph Report - NarradorCoop  (2026-10-17)

## Corpus Check
- 79 files · ~246,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 956 nodes · 2977 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1029 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `495cfd59`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Mundo.horas
- NarradorGenerador.lua
- NarradorMundo.lua
- NarradorConversacion.lua
- NarradorCuraServer.lua
- NarradorDiario.lua
- NarradorContactos.lua
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Bandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- Motor.estado
- NarradorOcupaciones.lua
- NarradorLore.lua
- Ind.menu
- narrador_narradordefs
- NarradorLegendario.lua
- Generados.lua
- Inmorales.lua
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- NarradorBell.lua
- NarradorPasajeros.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 108 edges
2. `Mundo.horas()` - 96 edges
3. `Mundo.azar()` - 68 edges
4. `Mundo.log()` - 44 edges
5. `Mundo.jugadores()` - 42 edges
6. `Motor.enviar()` - 41 edges
7. `Mundo.grupoDe()` - 36 edges
8. `Mundo.posicion()` - 35 edges
9. `Motor.iniciar()` - 33 edges
10. `C.estado()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `BA.tick()` --calls--> `Mundo.hayALife()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorBandido.lua → 42/media/lua/server/Narrador/NarradorMundoALife.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorLegendario.lua
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/shared/Narrador/NarradorKnoxDefs.lua
- `C.limpiar()` --calls--> `Mundo.quitarZombis()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `C.enterrar()` --calls--> `Mundo.quitarCadaver()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (34 total, 7 thin omitted)

### Community 0 - "Mundo.horas"
Cohesion: 0.05
Nodes (92): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+84 more)

### Community 1 - "NarradorGenerador.lua"
Cohesion: 0.10
Nodes (65): S.nivelConfianza(), C.darMapa(), C.decir(), C.def(), C.elegirEncargo(), C.encargoDelGrupo(), C.extra(), C.lugar() (+57 more)

### Community 2 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (58): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+50 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorCuraServer.lua"
Cohesion: 0.15
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (47): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+39 more)

### Community 6 - "NarradorContactos.lua"
Cohesion: 0.05
Nodes (89): anotar(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor() (+81 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.12
Nodes (28): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+20 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.11
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.12
Nodes (22): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), C.alMorir(), C.revisarRegresos(), C.vista() (+14 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Bandido.lua"
Cohesion: 0.16
Nodes (3): llegarAlPatio(), pereiraEnPatio(), KD.tono()

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.14
Nodes (15): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+7 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 15 - "Motor.estado"
Cohesion: 0.06
Nodes (85): CA.anotar(), CA.anotarContacto(), CA.revisar(), CA.st(), C.alMorir(), C.encargosActivos(), C.enterrar(), C.revisarDesbloqueo() (+77 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.20
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "narrador_narradordefs"
Cohesion: 0.11
Nodes (22): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+14 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.29
Nodes (10): K.generarRecado(), azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto() (+2 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 24 - "Inmorales.lua"
Cohesion: 0.43
Nodes (5): finales(), plazo(), registrarInmoral(), viaje(), volver()

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "NarradorBell.lua"
Cohesion: 0.22
Nodes (17): avisarCerca(), B.aparecer(), B.huir(), B.peligro(), B.sacar(), B.st(), B.tick(), B.vivos() (+9 more)

### Community 32 - "NarradorPasajeros.lua"
Cohesion: 0.30
Nodes (13): Mundo.actorVivo(), alLado(), enAuto(), jugadorPorNombre(), P.bajar(), P.esAcompanante(), P.lista(), P.mover() (+5 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `Mundo.horas`, `NarradorGenerador.lua`, `NarradorMundo.lua`, `NarradorPasajeros.lua`, `NarradorCuraServer.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorOcupaciones.lua`, `narrador_narradordefs`, `NarradorBell.lua`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `Defs.get()` connect `Motor.estado` to `Mundo.horas`, `NarradorGenerador.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorDefs.lua`, `NarradorBell.lua`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorGenerador.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorContactos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `Motor.estado`, `NarradorOcupaciones.lua`, `NarradorBell.lua`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 90 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `BA.jefe()`) actually correct?**
  _`Motor.estado()` has 90 INFERRED edges - model-reasoned connections that need verification._
- **Are the 95 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 95 INFERRED edges - model-reasoned connections that need verification._
- **Are the 58 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 42 inferred relationships involving `Mundo.log()` (e.g. with `A.lanzar()` and `BA.lanzar()`) actually correct?**
  _`Mundo.log()` has 42 INFERRED edges - model-reasoned connections that need verification._