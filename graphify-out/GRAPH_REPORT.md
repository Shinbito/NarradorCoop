# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 73 files · ~244,682 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 936 nodes · 2884 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 923 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8960cca0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorOcupaciones.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- Mundo.sandbox
- NarradorDominios.lua
- NarradorKnox.lua
- NarradorContactos.lua
- NarradorMundo.lua
- NarradorPasajeros.lua
- NarradorObjetosServer.lua
- NarradorIndicadoresCalc.lua
- NarradorMapas.lua
- NarradorLegendario.lua
- README.md
- Mundo.azar
- Generados.lua
- S.pedirFavor
- Ideas futuras: campamentos de supervivientes
- NarradorObjetos.lua
- envolver
- NarradorLore.lua
- Contratos.lua
- Sous.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 94 edges
2. `Mundo.horas()` - 91 edges
3. `Mundo.azar()` - 64 edges
4. `Mundo.jugadores()` - 41 edges
5. `Mundo.log()` - 40 edges
6. `Motor.enviar()` - 38 edges
7. `Mundo.grupoDe()` - 36 edges
8. `Mundo.posicion()` - 34 edges
9. `Motor.iniciar()` - 33 edges
10. `C.estado()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `EV.tick()` --calls--> `Mundo.hayALife()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorEduardo.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (88): C.elegirEncargo(), C.encargosActivos(), C.limpiar(), C.revisarMall(), C.zonaSegura(), listasDe(), S.alComando(), S.completarArco() (+80 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.06
Nodes (84): A.lanzar(), jugadoresDe(), BA.enCurso(), BA.jefe(), BA.lanzar(), BA.revisar(), BA.revisarConquista(), BA.revisarEduardo() (+76 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (46): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+38 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (31): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+23 more)

### Community 9 - "Mundo.sandbox"
Cohesion: 0.13
Nodes (27): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.presupuesto(), A.programar(), A.st() (+19 more)

### Community 10 - "NarradorDominios.lua"
Cohesion: 0.10
Nodes (26): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), C.revisarRegresos() (+18 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.06
Nodes (32): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), C.inmunes(), C.onNpcMuerto(), C.tonoKnox() (+24 more)

### Community 12 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (60): BA.tick(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), porValor(), S.aparecer() (+52 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.07
Nodes (42): mejorar(), S.comprar(), S.forjar(), contarTipos(), calza(), casillaLibre(), centro(), elegirSala() (+34 more)

### Community 14 - "NarradorPasajeros.lua"
Cohesion: 0.26
Nodes (15): C.curar(), Mundo.cuerpoActor(), alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante() (+7 more)

### Community 15 - "NarradorObjetosServer.lua"
Cohesion: 0.43
Nodes (5): Mundo.crearMapa(), Mundo.crearMapaZona(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 18 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 20 - "Mundo.azar"
Cohesion: 0.07
Nodes (87): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+79 more)

### Community 21 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 22 - "S.pedirFavor"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.06
Nodes (31): A. Eventos fortuitos de Eduardo (después de conocerlo), A. Eventos fortuitos de Eduardo (hecho, falta probar en el juego), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros (hecho, falta probar en el juego), Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar) (+23 more)

### Community 24 - "NarradorObjetos.lua"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

### Community 26 - "NarradorLore.lua"
Cohesion: 0.20
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 27 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 28 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `Mundo.sandbox`, `NarradorDominios.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorPasajeros.lua`, `Mundo.azar`, `S.pedirFavor`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `BA.jefe()`) actually correct?**
  _`Motor.estado()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.056886898096304594 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `Mundo.sandbox`, `NarradorDominios.lua`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `Mundo.azar`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 89 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 89 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.06471306471306472 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorMundo.lua` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorKnox.lua`, `NarradorContactos.lua`, `NarradorLegendario.lua`, `Mundo.azar`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._