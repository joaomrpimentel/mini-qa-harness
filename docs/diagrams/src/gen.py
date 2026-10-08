# Generates the docs diagrams as .excalidraw files, one per diagram and language.
#   python3 docs/diagrams/src/gen.py          -> docs/diagrams/<name>.<lang>.excalidraw
# Then export them to SVG with export.mjs. Open any .excalidraw on excalidraw.com to edit by hand.
import os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlib
from helpers import *

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
xlib.NOW = 1767225600000  # fixed timestamp, so regenerating does not churn the files

T = {
    'en': dict(
        flow_t='How a QA run flows', user='You', main='Main session', testers='Tester agents', app='App under test',
        ev='evidence/', draft='Draft report', gh='GitHub',
        n_user='Picks the feature,\nedits the drafts and\ngives the order to post', n_testers='UI only: no code, no API,\nno database. Several in\nparallel, a few cases each',
        n_ev='Screenshots, network,\ntrace and the k/k result', n_main='Reads the artifacts, not\nthe report, and rules out\nthe environment', n_gh='Issue with images and\nJam link, only after\nyour OK',
        leg='Legend', l_solid='calls or delivers', l_dash='goes back for review',

        pieces_t='The pieces', z_test='Testing path', z_report='Reporting path (main session only)',
        repro='reproduce()', session='Session', auth='Auth adapter', jam='Jam recorder', render='Issue render', upload='GitHub upload',
        n_repro='Reruns a case in fresh\nbrowsers and counts k/k', n_session='Logged-in page that\nrecords its own network,\nconsole, screenshots, trace',
        n_auth='Saved login, cookie,\nheader or minted JWT', n_jam='Drives the Jam extension\nwith a drawn cursor', n_render='Title from the draft,\nrefuses local images',
        n_upload='Drops images on a new\nissue box, never submits', l_dash2='evidence read back',

        run_t='One QA run, ticket to issue', intake='Intake', env='Environment', smoke='Smoke', test='Testers', verify='Verify', record='Record',
        drafts='Drafts', gate='Your OK', post='Post',
        n_intake='Copy the criteria\nword for word', n_env='Build deployed?\nMigrations? Data?', n_smoke='Every profile\nsigns in', n_test='One charter each,\nUI only, k/k',
        n_verify='Artifacts first,\nthen the environment', n_record='Jam video for\nconfirmed bugs', n_gate='You edit and give\nthe order', n_post='Issue and comment\non the ticket',

        states_t='Life of a finding', observed='Observed', reproduced='Reproduced k/k', verified='Verified', bug='BUG', drafted='Drafted', approved='Approved',
        posted='Posted', flaky='Flaky', observation='Observation', nottested='NOT_TESTED', comment='Ticket comment',
        n_repro2='Same verdict in k\nfresh sessions', n_verified='Main session checks\nartifacts and environment', n_bug='Contradicts a\nnamed oracle',
        n_approved='You edit and\ngive the order', n_nottested='A precondition is\nmissing; always\nwith a reason', n_observation='Low severity, no\noracle, or flaky',

        ev_t='What a test case leaves on disk', case='delete-pinned/', result='result.json', run1='run-1/', run2='run-2/', shots='NN-step.png', evj='evidence.json', trace='trace.zip',
        n_result='Verdict and summary,\nlike BUG 2/2', n_run2='Same layout as run-1', n_shots='One per step that\nproves something', n_evj='Network, console,\npage errors, verdict',
        n_trace='Kept only when the\nverdict is not OK',
    ),
    'pt-BR': dict(
        flow_t='Como uma rodada de QA corre', user='Você', main='Sessão principal', testers='Agentes testadores', app='App testada',
        ev='evidence/', draft='Rascunho', gh='GitHub',
        n_user='Escolhe a feature,\nedita os rascunhos e\ndá a ordem de postar', n_testers='Só pela tela: sem código,\nsem API, sem banco. Vários\nem paralelo, poucos casos',
        n_ev='Prints, rede, trace\ne o resultado k/k', n_main='Lê os artefatos, não o\nrelatório, e descarta\no ambiente', n_gh='Issue com imagens e\nlink do Jam, só depois\ndo seu ok',
        leg='Legenda', l_solid='chama ou entrega', l_dash='volta para revisão',

        pieces_t='As peças', z_test='Caminho do teste', z_report='Caminho do relato (só a sessão principal)',
        repro='reproduce()', session='Sessão', auth='Adaptador de auth', jam='Gravador do Jam', render='Render da issue', upload='Upload no GitHub',
        n_repro='Roda o caso de novo em\nbrowser limpo e conta k/k', n_session='Página logada que grava\na própria rede, console,\nprints e trace',
        n_auth='Login salvo, cookie,\nheader ou JWT gerado', n_jam='Dirige a extensão do Jam\ncom cursor desenhado', n_render='Título do rascunho,\nrecusa imagem local',
        n_upload='Solta a imagem numa issue\nnova e nunca submete', l_dash2='evidência lida de volta',

        run_t='Uma rodada de QA, do ticket à issue', intake='Entrada', env='Ambiente', smoke='Smoke', test='Testadores', verify='Verificar', record='Gravar',
        drafts='Rascunhos', gate='Seu ok', post='Postar',
        n_intake='Copiar os critérios\nletra por letra', n_env='Build no ar?\nMigrations? Dados?', n_smoke='Todo perfil\nconsegue entrar', n_test='Um charter cada,\nsó pela tela, k/k',
        n_verify='Artefato primeiro,\ndepois o ambiente', n_record='Vídeo no Jam dos\nbugs confirmados', n_gate='Você edita e\ndá a ordem', n_post='Issue e comentário\nno ticket',

        states_t='A vida de um achado', observed='Observado', reproduced='Reproduzido k/k', verified='Verificado', bug='BUG', drafted='Rascunho', approved='Aprovado',
        posted='Postado', flaky='Instável', observation='Observação', nottested='NOT_TESTED', comment='Comentário no ticket',
        n_repro2='Mesmo veredito em k\nsessões limpas', n_verified='A sessão principal confere\nartefato e ambiente', n_bug='Contradiz um\noráculo nomeado',
        n_approved='Você edita e\ndá a ordem', n_nottested='Falta uma\npré-condição; sempre\ncom motivo', n_observation='Gravidade baixa,\nsem oráculo ou instável',

        ev_t='O que um caso deixa no disco', case='delete-pinned/', result='result.json', run1='run-1/', run2='run-2/', shots='NN-passo.png', evj='evidence.json', trace='trace.zip',
        n_result='Veredito e resumo,\ncomo BUG 2/2', n_run2='Igual ao run-1', n_shots='Uma por passo\nque prova algo', n_evj='Rede, console,\nerros da página, veredito',
        n_trace='Guardado só quando o\nveredito não é OK',
    ),
}
G = 6


def flow(t):
    d = D(); head(d, t['flow_t'])
    us = boneco(d, t['user']); place(d, us, 0, 0)
    ma = B(d, 300, 0, t['main']); te = B(d, 720, 0, t['testers']); ap = B(d, 1160, 0, t['app'])
    for b in (ma, te, ap): setc(d, b, y=cyv(us))
    ev = B(d, 0, 0, t['ev']); setc(d, ev, x=cx(te), y=cyv(us) + 360)
    dr = B(d, 0, 0, t['draft']); setc(d, dr, x=cx(ma) - 50, y=cyv(us) + 680)
    gh = B(d, 0, 0, t['gh']); setc(d, gh, x=cx(te), y=cyv(dr))
    A(d, us, ma); A(d, ma, te); A(d, te, ap); A(d, te, ev, side='v')
    xr = cx(ma) + 50
    d.path(ev, ma, [(ev['x'] - G, cyv(ev)), (xr, cyv(ev)), (xr, below(ma, G))], style='dashed')
    d.path(ma, dr, [(cx(dr), below(ma, G)), (cx(dr), dr['y'] - G)])
    A(d, dr, gh)
    d.path(dr, us, [(dr['x'] - G, cyv(dr)), (cx(us), cyv(dr)), (cx(us), below(us, G))], style='dashed')
    note(d, us, t['n_user'], 'above', gap=70)
    note(d, te, t['n_testers'], 'above', gap=70)
    note(d, ma, t['n_main'], 'above', gap=70, dx=-40)
    note(d, ev, t['n_ev'], 'right', gap=80)
    note(d, gh, t['n_gh'], 'right', gap=80)
    x0, _, _, y1 = bbox(d.els)
    d.legend(x0, y1 + 120, [('solid', t['l_solid']), ('dashed', t['l_dash'])], title=t['leg'])
    return d


def pieces(t):
    d = D(); head(d, t['pieces_t'])
    us = boneco(d, t['user']); place(d, us, 40, -420)
    ma = B(d, 0, 0, t['main']); te = B(d, 400, 0, t['testers']); rp = B(d, 780, 0, t['repro'])
    se = B(d, 1160, 0, t['session']); ap = B(d, 2080, 0, t['app'])
    au = B(d, 1160, -330, t['auth']); ev = B(d, 1160, 360, t['ev'])
    setc(d, us, x=cx(ma))
    A(d, us, ma, side='v'); A(d, ma, te); A(d, te, rp); A(d, rp, se); A(d, se, ap); A(d, au, se, side='v'); A(d, se, ev, side='v')
    xr = cx(ma) + 50
    d.path(ev, ma, [(ev['x'] - G, cyv(ev)), (xr, cyv(ev)), (xr, below(ma, G))], style='dashed')
    # reporting row, fed from the main session's left side
    jm = B(d, -880, 720, t['jam']); rd = B(d, -460, 720, t['render']); up = B(d, -40, 720, t['upload'])
    d.path(ma, jm, [(ma['x'] - G, cyv(ma) - 25), (cx(jm), cyv(ma) - 25), (cx(jm), jm['y'] - G)])
    d.path(ma, rd, [(ma['x'] - G, cyv(ma) + 25), (cx(rd), cyv(ma) + 25), (cx(rd), rd['y'] - G)])
    A(d, rd, up)
    n = [note(d, rp, t['n_repro'], 'above', gap=70), note(d, se, t['n_session'], 'right', gap=80, dy=190),
         note(d, au, t['n_auth'], 'right', gap=80), note(d, jm, t['n_jam'], 'below', gap=70),
         note(d, rd, t['n_render'], 'below', gap=70), note(d, up, t['n_upload'], 'below', gap=70)]
    zone_around(d, [te, rp, se, au, ev, n[0], n[1], n[2]], t['z_test'], BLUE)
    zone_around(d, [jm, rd, up, n[3], n[4], n[5]], t['z_report'], ORANGE, title_right=True)
    x0, _, _, y1 = bbox(d.els)
    d.legend(x0, y1 + 120, [('solid', t['l_solid']), ('dashed', t['l_dash2'])], title=t['leg'])
    return d


def run(t):
    d = D(); head(d, t['run_t'])
    row1 = [B(d, 0, 0, t[k]) for k in ('intake', 'env', 'smoke', 'test')]
    row2 = [B(d, 0, 0, t[k]) for k in ('verify', 'record', 'drafts')]
    gate = B(d, 0, 0, t['gate'], t='diamond'); po = B(d, 0, 0, t['post'], fill=GREEN)
    row2 += [gate, po]
    x = 0
    for b in row1: place(d, b, x, 0); x = right(b) + 160
    x = 0
    for b in row2: setc(d, b, x=x + b['width'] / 2, y=420); x = right(b) + 160
    for a, b in zip(row1, row1[1:]): A(d, a, b)
    for a, b in zip(row2, row2[1:]): A(d, a, b)
    last, first = row1[-1], row2[0]; my = (below(last) + first['y']) / 2
    d.path(last, first, [(cx(last), below(last, G)), (cx(last), my), (cx(first), my), (cx(first), first['y'] - G)])
    us = boneco(d, t['user']); setc(d, us, x=cx(gate), y=below(gate) + 260)
    A(d, us, gate, side='v')
    for b, k in zip(row1, ('n_intake', 'n_env', 'n_smoke', 'n_test')): note(d, b, t[k], 'above', gap=70)
    note(d, row2[0], t['n_verify'], 'below', gap=70); note(d, row2[1], t['n_record'], 'below', gap=70)
    note(d, us, t['n_gate'], 'left', gap=90)
    note(d, po, t['n_post'], 'below', gap=70)
    return d


def states(t):
    d = D(); head(d, t['states_t'])
    ob = B(d, 0, 0, t['observed']); rp = B(d, 380, 0, t['reproduced']); ve = B(d, 820, 0, t['verified'])
    bg = B(d, 1220, 0, t['bug'], fill=RED); dr = B(d, 1580, 0, t['drafted']); apv = B(d, 1940, 0, t['approved']); po = B(d, 2300, 0, t['posted'], fill=GREEN)
    for b in (rp, ve, bg, dr, apv, po): setc(d, b, y=cyv(ob))
    for a, b in ((ob, rp), (rp, ve), (ve, bg), (bg, dr), (dr, apv), (apv, po)): A(d, a, b)
    fl = B(d, 0, 0, t['flaky']); setc(d, fl, x=cx(ob), y=cyv(ob) + 360)
    obs = B(d, 0, 0, t['observation']); setc(d, obs, x=cx(rp), y=cyv(fl))
    nt = B(d, 0, 0, t['nottested']); setc(d, nt, x=right(ve) - 10, y=cyv(fl))
    cm = B(d, 0, 0, t['comment'], fill=GREEN); setc(d, cm, x=cx(nt), y=cyv(fl) + 330)
    A(d, ob, fl, side='v'); A(d, fl, obs)
    xo = ve['x'] + 30
    d.path(ve, obs, [(xo, below(ve, G)), (xo, cyv(obs)), (right(obs, G), cyv(obs))])
    d.path(ve, nt, [(cx(nt), below(ve, G)), (cx(nt), nt['y'] - G)]) if nt['x'] < right(ve) else A(d, ve, nt, side='v')
    A(d, nt, cm, side='v')
    d.path(obs, cm, [(cx(obs), below(obs, G)), (cx(obs), cyv(cm)), (cm['x'] - G, cyv(cm))])
    note(d, rp, t['n_repro2'], 'above', gap=70); note(d, ve, t['n_verified'], 'above', gap=70)
    note(d, bg, t['n_bug'], 'below', gap=70); note(d, apv, t['n_approved'], 'below', gap=70)
    note(d, nt, t['n_nottested'], 'right', gap=80); note(d, obs, t['n_observation'], 'above', gap=40)
    return d


def evidence(t):
    d = D(); head(d, t['ev_t'])
    ca = B(d, 0, 0, t['case'])
    re = B(d, 480, -300, t['result']); r1 = B(d, 480, 0, t['run1']); r2 = B(d, 480, 300, t['run2'])
    sh = B(d, 960, -300, t['shots']); ej = B(d, 960, 0, t['evj']); tr = B(d, 960, 300, t['trace'])
    for b in (re, r2): setc(d, b, x=cx(r1))
    for b in (sh, ej, tr): setc(d, b, x=cx(ej))
    for a, b in ((ca, re), (ca, r1), (ca, r2), (r1, sh), (r1, ej), (r1, tr)): A(d, a, b, side='h')
    note(d, re, t['n_result'], 'above', gap=60); note(d, r2, t['n_run2'], 'below', gap=60)
    note(d, sh, t['n_shots'], 'right', gap=80); note(d, ej, t['n_evj'], 'right', gap=80); note(d, tr, t['n_trace'], 'right', gap=80)
    return d


if __name__ == '__main__':
    for name, fn in (('flow', flow), ('pieces', pieces), ('run', run), ('states', states), ('evidence', evidence)):
        for lang, t in T.items():
            random.seed(f'{name}-{lang}')
            n = finish(fn(t), os.path.join(OUT, f'{name}.{lang}.excalidraw'), name)
            print(f'{name}.{lang}.excalidraw', n, 'elements')
