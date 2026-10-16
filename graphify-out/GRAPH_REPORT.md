# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 53 files · ~189,443 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 768 nodes · 2373 edges · 23 communities (22 shown, 1 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 713 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7639b921`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorContactos.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- NarradorMundo.lua
- NarradorCuraServer.lua
- Generados.lua
- NarradorOcupaciones.lua
- NarradorReputacion.lua
- NarradorLegendario.lua
- NarradorLore.lua
- NarradorIndicadoresCalc.lua
- Cliente.recibir
- NarradorPasajeros.lua
- README.md
- NarradorGenerador.lua
- NarradorCalendario.lua
- Ideas futuras: campamentos de supervivientes

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 73 edges
2. `Mundo.horas()` - 72 edges
3. `Mundo.azar()` - 57 edges
4. `Mundo.log()` - 34 edges
5. `Mundo.jugadores()` - 33 edges
6. `Mundo.posicion()` - 30 edges
7. `Motor.iniciar()` - 29 edges
8. `Motor.enviar()` - 28 edges
9. `Motor.publicar()` - 25 edges
10. `Mundo.grupoDe()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.onNpcMuerto()` --calls--> `Mundo.esJugador()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.elegir()` --calls--> `Mundo.tieneEtiqueta()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.casillaConPared()` --calls--> `Mundo.cargado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorObjetosServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (23 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.05
Nodes (125): Cal.calor(), Cal.dulces(), Cal.niebla(), Cal.st(), Cal.ultimaNoche(), C.alMorir(), C.darMapa(), C.decir() (+117 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.10
Nodes (61): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+53 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.09
Nodes (40): C.anotarPuertas(), C.aparecer(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.desbloqueado(), C.encargoActivo(), C.estado() (+32 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (41): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+33 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (46): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+38 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (22): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+14 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.11
Nodes (23): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+15 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (26): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+18 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (47): contarTipos(), H.dispararEco(), calza(), casillaLibre(), centro(), elegirSala(), mismasBanderas(), Mundo.acompanar() (+39 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 12 - "NarradorOcupaciones.lua"
Cohesion: 0.24
Nodes (17): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.estadoTexto() (+9 more)

### Community 13 - "NarradorReputacion.lua"
Cohesion: 0.34
Nodes (16): nombreGrupo(), R.activa(), R.alTerminar(), R.ascenso(), R.bonusChetada(), R.cantidadOfertas(), R.falta(), R.nivel() (+8 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 15 - "NarradorLore.lua"
Cohesion: 0.43
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 17 - "Cliente.recibir"
Cohesion: 0.33
Nodes (7): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.cartel(), Cliente.decir(), Cliente.marcar(), Cliente.ponerMarcas(), Cliente.recibir()

### Community 18 - "NarradorPasajeros.lua"
Cohesion: 0.24
Nodes (16): C.curar(), Mundo.actorVivo(), Mundo.cuerpoActor(), alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar() (+8 more)

### Community 20 - "NarradorGenerador.lua"
Cohesion: 0.23
Nodes (19): chance(), elegir(), G.anotarCliente(), G.elegirCliente(), G.elegirTipo(), G.enviarOfertas(), G.estado(), G.generar() (+11 more)

### Community 21 - "NarradorCalendario.lua"
Cohesion: 0.18
Nodes (15): Cal.amigoSecreto(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.residente(), Cal.sousAliados(), Cal.tick(), Cal.una() (+7 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.12
Nodes (16): Brújula sigue a la cámara (hecho, falta probar en el juego), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético, Fase 1: el campamento existe y crece, Fase 2: reservas y trueque, Fase 3: oficios, Fase 4: historia propia del campamento (+8 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorDiario.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorOcupaciones.lua`, `NarradorReputacion.lua`, `NarradorPasajeros.lua`, `NarradorGenerador.lua`, `NarradorCalendario.lua`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 49 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 49 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.052116875372689324 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorOcupaciones.lua`, `NarradorReputacion.lua`, `NarradorGenerador.lua`, `NarradorCalendario.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.09573412698412699 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorOcupaciones.lua`, `NarradorGenerador.lua`, `NarradorCalendario.lua`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._