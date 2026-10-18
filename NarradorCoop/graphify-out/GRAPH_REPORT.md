# Graph Report - NarradorCoop  (2026-10-18)

## Corpus Check
- 97 files · ~290,534 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .X 19, (none) 1, .jar 1)

## Summary
- 1123 nodes · 3484 edges · 49 communities (40 shown, 9 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1229 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f7b26a1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Mundo.horas
- Mundo.azar
- NarradorMundo.lua
- NarradorConversacion.lua
- narrador_narradordefs
- NarradorDiario.lua
- NarradorContactos.lua
- Mundo.jugadores
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- Bandido.lua
- NarradorIndicadores.lua
- NarradorDefs.lua
- NarradorIndicadoresCalc.lua
- NarradorMotor.lua
- NarradorOcupaciones.lua
- NarradorLore.lua
- Ind.menu
- NarradorMapas.lua
- NarradorCampamentosDefs.lua
- Generados.lua
- NarradorSousBase.lua
- Inmorales.lua
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- NarradorBell.lua
- NarradorPasajeros.lua
- Motor.estado
- NarradorViewpoint
- NarradorCampamentos.lua
- NarradorMundoALife.lua
- NarradorMotorGrupos.lua
- C.estado
- Mundo.jugadorCerca
- Mundo.posicionActor
- Motor.procesarPendientes
- HistoriasSous2.lua
- S.pedirFavor
- HistoriasSous1.lua
- NarradorHistoriasSous2.lua
- EV.revisar
- MQ.revisar
- NarradorVenganzaMeulen.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 138 edges
2. `Mundo.horas()` - 106 edges
3. `Mundo.azar()` - 72 edges
4. `Mundo.log()` - 61 edges
5. `Mundo.jugadores()` - 47 edges
6. `Motor.enviar()` - 44 edges
7. `Mundo.grupoDe()` - 40 edges
8. `Motor.publicar()` - 39 edges
9. `Mundo.jugadorCerca()` - 37 edges
10. `C.estado()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `BA.tick()` --calls--> `Mundo.hayALife()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorBandido.lua → 42/media/lua/server/Narrador/NarradorMundoALife.lua
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCalendario.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `S.estado()` --calls--> `K.reservasIniciales()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.enAtaque()` --calls--> `C.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/server/Narrador/NarradorContactos.lua
- `S.juntar()` --calls--> `K.valorMedicina()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua

## Import Cycles
- None detected.

## Communities (49 total, 9 thin omitted)

### Community 0 - "Mundo.horas"
Cohesion: 0.10
Nodes (49): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+41 more)

### Community 1 - "Mundo.azar"
Cohesion: 0.06
Nodes (94): avisarTodos(), Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla() (+86 more)

### Community 2 - "NarradorMundo.lua"
Cohesion: 0.05
Nodes (54): C.armaKit(), contarTipos(), H.crearArma(), H.crearArmas(), H.tick(), H.crearArma(), H.dispararEco(), calza() (+46 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.06
Nodes (72): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+64 more)

### Community 4 - "narrador_narradordefs"
Cohesion: 0.09
Nodes (26): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), E.activo() (+18 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.08
Nodes (48): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+40 more)

### Community 6 - "NarradorContactos.lua"
Cohesion: 0.15
Nodes (20): abierta(), C.anotarPuertas(), C.cuerpoMuerto(), C.curarPuertas(), C.encargoActivo(), C.inmuneMurio(), C.inmunes(), C.migrarDesbloqueo() (+12 more)

### Community 7 - "Mundo.jugadores"
Cohesion: 0.07
Nodes (60): jugadoresDe(), BA.consecuenciaUltimo(), BA.enCurso(), BA.jefe(), BA.jefeCorto(), BA.lanzar(), BA.revisar(), BA.revisarConquista() (+52 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.11
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.09
Nodes (28): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), CA.anotar(), CA.anotarContacto(), CA.revisar() (+20 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Bandido.lua"
Cohesion: 0.15
Nodes (5): finalRedimido(), J(), llegarAlPatio(), pereiraEnPatio(), KD.tono()

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (18): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+10 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.24
Nodes (14): Ind.aPantalla(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color(), IC.distancia() (+6 more)

### Community 15 - "NarradorMotor.lua"
Cohesion: 0.12
Nodes (31): C.encargosActivos(), C.revisarMall(), hayContadorDeBajas(), Motor.actualizarPropios(), Motor.anotar(), Motor.avisar(), Motor.avisarContador(), Motor.cantidad() (+23 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.20
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "NarradorMapas.lua"
Cohesion: 0.22
Nodes (10): apiSimbolos(), datosDe(), fuenteTexto(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu() (+2 more)

### Community 21 - "NarradorCampamentosDefs.lua"
Cohesion: 0.22
Nodes (9): S.gastar(), S.recadoActual(), K.gastoDiario(), K.generarRecado(), K.persona(), K.reservasIniciales(), K.valorMedicina(), K.valorPrenda() (+1 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "NarradorSousBase.lua"
Cohesion: 0.13
Nodes (30): adentro(), alturaMesa(), anillos(), cabeMesa(), clave(), edificio(), esGrupoBase(), esSuelo() (+22 more)

### Community 24 - "Inmorales.lua"
Cohesion: 0.43
Nodes (5): finales(), plazo(), registrarInmoral(), viaje(), volver()

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.28
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "NarradorBell.lua"
Cohesion: 0.23
Nodes (16): avisarCerca(), B.alVolver(), B.aparecer(), B.huir(), B.limpiarCasa(), B.peligro(), B.rondar(), B.rondarHistoria() (+8 more)

### Community 32 - "NarradorPasajeros.lua"
Cohesion: 0.11
Nodes (37): C.curar(), ED.aparecer(), ED.corresponde(), ED.enHistoria(), ED.sigueme(), ED.st(), ED.tick(), ED.vuelve() (+29 more)

### Community 33 - "Motor.estado"
Cohesion: 0.21
Nodes (23): C.alMorir(), C.enterrar(), C.revisarDesbloqueo(), C.alMorir(), D.cambiar(), D.reemplazo(), H.disponible(), H.ocupado() (+15 more)

### Community 35 - "NarradorCampamentos.lua"
Cohesion: 0.17
Nodes (19): anotar(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor(), S.aparecer() (+11 more)

### Community 36 - "NarradorMundoALife.lua"
Cohesion: 0.20
Nodes (15): C.aparecer(), G.revisarVecinos(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.asesinoALife(), Mundo.banderas(), Mundo.claveALife() (+7 more)

### Community 37 - "NarradorMotorGrupos.lua"
Cohesion: 0.22
Nodes (16): Motor.copiar(), Motor.diferir(), Motor.acompanarGrupo(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.completarGrupo(), Motor.corregirNombres(), Motor.filtrarPerfiles() (+8 more)

### Community 38 - "C.estado"
Cohesion: 0.23
Nodes (13): avisarTodos(), S.estado(), S.revisar(), S.sumarSalvado(), S.tick(), S.vista(), CO.arsenal(), CO.estanque() (+5 more)

### Community 39 - "Mundo.jugadorCerca"
Cohesion: 0.26
Nodes (13): S.revisarAtaque(), C.cajaEdificio(), C.cuerpoRoto(), C.limpiar(), C.recorrerEdificio(), C.reponer(), C.reponerEdificio(), C.zonaSegura() (+5 more)

### Community 40 - "Mundo.posicionActor"
Cohesion: 0.23
Nodes (12): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar(), S.nombreDe(), S.residentesInfo() (+4 more)

### Community 41 - "Motor.procesarPendientes"
Cohesion: 0.23
Nodes (11): C.reponerUnaVez(), Motor.procesarPendientes(), Motor.valor(), Motor.copiarPlano(), Motor.ejecutar(), Motor.resolverVars(), Motor.retirarGrupo(), Motor.tamanoHorda() (+3 more)

### Community 43 - "S.pedirFavor"
Cohesion: 0.50
Nodes (7): S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 45 - "NarradorHistoriasSous2.lua"
Cohesion: 0.48
Nodes (5): H.haySousActiva(), H.siguiente(), H.tick(), H.ultimoInicioSous(), HS.idDe()

### Community 46 - "EV.revisar"
Cohesion: 0.50
Nodes (3): EV.puede(), EV.revisar(), EV.tick()

### Community 47 - "MQ.revisar"
Cohesion: 0.70
Nodes (4): MQ.buscar(), MQ.casillaJunto(), MQ.poner(), MQ.revisar()

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `Mundo.horas`, `Mundo.azar`, `NarradorMundo.lua`, `narrador_narradordefs`, `NarradorContactos.lua`, `Mundo.jugadores`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorSousBase.lua`, `NarradorBell.lua`, `NarradorPasajeros.lua`, `NarradorCampamentos.lua`, `NarradorMundoALife.lua`, `NarradorMotorGrupos.lua`, `C.estado`, `Mundo.jugadorCerca`, `Mundo.posicionActor`, `Motor.procesarPendientes`, `S.pedirFavor`, `NarradorHistoriasSous2.lua`, `EV.revisar`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `Defs.get()` connect `NarradorMotor.lua` to `NarradorPasajeros.lua`, `Motor.estado`, `Mundo.azar`, `narrador_narradordefs`, `C.estado`, `Mundo.jugadores`, `Mundo.posicionActor`, `NarradorDefs.lua`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `Mundo.azar`, `NarradorMundo.lua`, `narrador_narradordefs`, `NarradorContactos.lua`, `Mundo.jugadores`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorCampamentosDefs.lua`, `NarradorSousBase.lua`, `NarradorBell.lua`, `NarradorPasajeros.lua`, `Motor.estado`, `NarradorCampamentos.lua`, `NarradorMundoALife.lua`, `NarradorMotorGrupos.lua`, `C.estado`, `Mundo.jugadorCerca`, `Motor.procesarPendientes`, `NarradorHistoriasSous2.lua`, `EV.revisar`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 119 inferred relationships involving `Motor.estado()` (e.g. with `A.programar()` and `A.st()`) actually correct?**
  _`Motor.estado()` has 119 INFERRED edges - model-reasoned connections that need verification._
- **Are the 105 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 105 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 59 inferred relationships involving `Mundo.log()` (e.g. with `A.lanzar()` and `BA.consecuenciaUltimo()`) actually correct?**
  _`Mundo.log()` has 59 INFERRED edges - model-reasoned connections that need verification._