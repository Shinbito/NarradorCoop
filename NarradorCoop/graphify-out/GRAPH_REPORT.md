# Graph Report - NarradorCoop  (2026-10-17)

## Corpus Check
- 77 files · ~243,317 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 946 nodes · 2948 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1019 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fae9655c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Mundo.horas
- NarradorMotor.lua
- NarradorMundo.lua
- NarradorConversacion.lua
- NarradorCalendario.lua
- NarradorDiario.lua
- Motor.estado
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Bandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorMundoALife.lua
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
- Mundo.nombreJugador
- NarradorReputacion.lua
- NarradorEncuentros.lua
- Mundo.azar

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 105 edges
2. `Mundo.horas()` - 95 edges
3. `Mundo.azar()` - 68 edges
4. `Mundo.log()` - 43 edges
5. `Mundo.jugadores()` - 42 edges
6. `Motor.enviar()` - 40 edges
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
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMotor.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (36 total, 6 thin omitted)

### Community 0 - "Mundo.horas"
Cohesion: 0.07
Nodes (61): BA.enCurso(), BA.jefe(), BA.lanzar(), BA.revisar(), BA.revisarConquista(), BA.revisarEduardo(), BA.revisarMaulen(), BA.sousEnPie() (+53 more)

### Community 1 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (108): jugadorConGancho(), Cal.brujasNoche(), Cal.dulces(), Cal.ultimaNoche(), S.comprar(), S.empezarAtaque(), S.forjar(), S.seguirAtaque() (+100 more)

### Community 2 - "NarradorMundo.lua"
Cohesion: 0.11
Nodes (19): contarTipos(), H.dispararEco(), Motor.onZombiMuerto(), Motor.registrarBaja(), casillaLibre(), Mundo.buscarItems(), Mundo.crearItem(), Mundo.crearMapa() (+11 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorCalendario.lua"
Cohesion: 0.14
Nodes (23): B.migrar(), Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+15 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (46): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+38 more)

### Community 6 - "Motor.estado"
Cohesion: 0.07
Nodes (71): anotar(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor() (+63 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.14
Nodes (18): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), anotar(), KX.alMorirNpc(), KX.bandidosLimpios() (+10 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.11
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.17
Nodes (18): C.alMorir(), C.revisarRegresos(), C.vista(), CS.pedir(), D.aplicar(), D.cambiar(), D.dominio(), D.esBandido() (+10 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Bandido.lua"
Cohesion: 0.15
Nodes (4): llegarAlPatio(), pereiraEnPatio(), KD.nivel(), KD.tono()

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.14
Nodes (15): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+7 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 15 - "NarradorMundoALife.lua"
Cohesion: 0.07
Nodes (51): C.aparecer(), G.revisarVecinos(), Motor.avisar(), Motor.cantidad(), Motor.copiar(), Motor.procesarPendientes(), Motor.sortear(), Motor.valor() (+43 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.18
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "narrador_narradordefs"
Cohesion: 0.05
Nodes (44): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+36 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

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
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "NarradorBell.lua"
Cohesion: 0.19
Nodes (19): avisarCerca(), B.aparecer(), B.huir(), B.peligro(), B.sacar(), B.st(), B.tick(), B.vivos() (+11 more)

### Community 32 - "Mundo.nombreJugador"
Cohesion: 0.22
Nodes (19): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+11 more)

### Community 33 - "NarradorReputacion.lua"
Cohesion: 0.30
Nodes (18): S.nivelConfianza(), nombreGrupo(), R.activa(), R.alTerminar(), R.ascenso(), R.bonusChetada(), R.cantidadOfertas(), R.despreciado() (+10 more)

### Community 34 - "NarradorEncuentros.lua"
Cohesion: 0.25
Nodes (12): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+4 more)

### Community 35 - "Mundo.azar"
Cohesion: 0.31
Nodes (13): Motor.resolverTexto(), Motor.sacarDeBolsa(), calza(), centro(), elegirSala(), Mundo.azar(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo() (+5 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Defs.get()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorEncuentros.lua`, `Motor.estado`, `NarradorDefs.lua`, `narrador_narradordefs`, `NarradorBell.lua`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `Motor.estado()` connect `Motor.estado` to `Mundo.nombreJugador`, `Mundo.horas`, `NarradorMotor.lua`, `NarradorEncuentros.lua`, `NarradorCalendario.lua`, `NarradorMundo.lua`, `NarradorReputacion.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorMundoALife.lua`, `NarradorOcupaciones.lua`, `narrador_narradordefs`, `NarradorBell.lua`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `Mundo.nombreJugador`, `NarradorMotor.lua`, `NarradorEncuentros.lua`, `NarradorMundo.lua`, `NarradorCalendario.lua`, `NarradorReputacion.lua`, `Motor.estado`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorMundoALife.lua`, `NarradorOcupaciones.lua`, `narrador_narradordefs`, `NarradorBell.lua`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 87 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `BA.jefe()`) actually correct?**
  _`Motor.estado()` has 87 INFERRED edges - model-reasoned connections that need verification._
- **Are the 94 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 94 INFERRED edges - model-reasoned connections that need verification._
- **Are the 58 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 41 inferred relationships involving `Mundo.log()` (e.g. with `A.lanzar()` and `BA.lanzar()`) actually correct?**
  _`Mundo.log()` has 41 INFERRED edges - model-reasoned connections that need verification._