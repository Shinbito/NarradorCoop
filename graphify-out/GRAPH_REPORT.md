# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 59 files · ~199,720 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 824 nodes · 2555 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 796 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e65ce76d`
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
- NarradorMundo.lua
- NarradorCuraServer.lua
- NarradorHuellas.lua
- Generados.lua
- NarradorLegendario.lua
- NarradorIndicadoresCalc.lua
- Cliente.recibir
- NarradorContactos.lua
- README.md
- NarradorContactos.lua
- Ideas futuras: campamentos de supervivientes

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 83 edges
2. `Mundo.horas()` - 77 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 37 edges
5. `Mundo.jugadores()` - 36 edges
6. `Motor.enviar()` - 31 edges
7. `Mundo.posicion()` - 31 edges
8. `Motor.iniciar()` - 30 edges
9. `C.estado()` - 28 edges
10. `Motor.publicar()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.onNpcMuerto()` --calls--> `Mundo.esJugador()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Ind.menuAdmin()` --calls--> `Cliente.enviar()`  [INFERRED]
  NarradorCoop/42/media/lua/client/Narrador/NarradorIndicadores.lua → NarradorCoop/42/media/lua/client/Narrador/NarradorCliente.lua

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (104): C.alMorir(), C.aparecer(), C.encargoActivo(), C.enterrar(), C.limpiar(), C.migrarDesbloqueo(), C.reponer(), C.revisarDesbloqueo() (+96 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.08
Nodes (73): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+65 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.24
Nodes (17): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.estadoTexto() (+9 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.06
Nodes (36): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+28 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (50): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+42 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (22): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+14 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.11
Nodes (23): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+15 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (57): C.cajaEdificio(), C.curar(), C.ubicar(), Director.revisarVisitas(), contarTipos(), H.dispararEco(), calza(), casillaLibre() (+49 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorHuellas.lua"
Cohesion: 0.18
Nodes (19): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+11 more)

### Community 12 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 17 - "Cliente.recibir"
Cohesion: 0.33
Nodes (7): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.cartel(), Cliente.decir(), Cliente.marcar(), Cliente.ponerMarcas(), Cliente.recibir()

### Community 18 - "NarradorContactos.lua"
Cohesion: 0.08
Nodes (43): KC.menu(), KC.miConfianza(), anotar(), avisarTodos(), esCaja(), esMunicion(), esRopaSuelta(), mejorar() (+35 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (86): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+78 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.08
Nodes (25): A. Eventos fortuitos de Tomás (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+17 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorHuellas.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 59 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.05606523955147808 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorHuellas.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 75 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 75 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.07592407592407592 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorMundo.lua`, `NarradorLegendario.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._