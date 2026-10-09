import { useState, useCallback } from 'react';
import type { AnalysisResult, Simulation, StreamEvent } from '../../api/types';
import type { TimelineStage } from '../../components/timeline/InvestigationTimeline';
import {
  analyzeConversation,
  analyzePayment,
  analyzeDocument,
  analyzeVoice,
  simulateWhatIf,
} from '../../api/client';

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error';

const STAGE_LABELS: Record<string, string> = {
  received: 'Request received',
  extracting: 'Extracting content',
  checking: 'Running checks',
  reasoning: 'AI reasoning',
  scoring: 'Computing risk score',
};

export function useConversationAnalysis() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'skipped' | 'failed' | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [stages, setStages] = useState<TimelineStage[]>([]);

  const updateStage = (stageName: string, detail?: string) => {
    setStages(prev => {
      const newStages: TimelineStage[] = prev.map(s => ({
        ...s,
        status: s.status === 'active' ? ('done' as const) : s.status,
      }));

      const existing = newStages.find(s => s.id === stageName);
      if (existing) {
        existing.status = 'active';
        if (detail) existing.detail = detail;
      } else {
        newStages.push({
          id: stageName,
          label: STAGE_LABELS[stageName] || stageName,
          status: 'active',
          detail,
        });
      }
      return newStages;
    });
  };

  const analyze = useCallback(async (text?: string, file?: File, feature: string = 'conversation') => {
    setState('analyzing');
    setResult(null);
    setSimulation(null);
    setSaveStatus(null);
    setError(null);
    setStages([]);

    try {
      let stream: AsyncGenerator<StreamEvent>;
      if (feature === 'payment') {
        stream = analyzePayment(file, text);
      } else if (feature === 'document') {
        if (!file) throw new Error('File required for document analysis');
        stream = analyzeDocument(file, text);
      } else if (feature === 'voice') {
        if (!file) throw new Error('Audio file required for voice analysis');
        stream = analyzeVoice(file, text);
      } else {
        stream = analyzeConversation(text, file);
      }

      for await (const event of stream) {
        if (event.type === 'stage') {
          updateStage(event.stage, event.detail);
        } else if (event.type === 'result') {
          // Mark all stages done
          setStages(prev => prev.map(s => ({ ...s, status: 'done' as const })));
          setResult(event.data);
          setState('done');
        } else if ((event as any).type === 'save_status') {
          const st = (event as any).status;
          setSaveStatus(st === 'save_skipped' ? 'skipped' : st === 'save_failed' ? 'failed' : 'saved');
        } else if (event.type === 'error') {
          setError({ code: event.code, message: event.message });
          setState('error');
        }
      }
    } catch (e: any) {
      setError({ code: 'UNKNOWN', message: e.message || 'Connection lost. Please try again.' });
      setState('error');
    }
  }, []);

  const simulate = useCallback(async (req: { analysis_id?: string; analysis?: any; description?: string }) => {
    setState('analyzing');
    setResult(null);
    setSimulation(null);
    setError(null);
    setStages([
      { id: 'extracting', label: 'Extracting scenario context', status: 'active' },
    ]);

    try {
      setTimeout(() => {
        updateStage('reasoning', 'Projecting social-engineering escalations');
      }, 500);

      const sim = await simulateWhatIf(req);
      setStages([
        { id: 'extracting', label: 'Extracting scenario context', status: 'done' },
        { id: 'reasoning', label: 'Projecting social-engineering escalations', status: 'done' },
        { id: 'scoring', label: 'Generating safe exit milestones', status: 'done' },
      ]);
      setSimulation(sim);
      setState('done');
    } catch (e: any) {
      setError({ code: 'SIMULATION_FAILED', message: e.message || 'Failed to simulate attack path.' });
      setState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setSimulation(null);
    setSaveStatus(null);
    setError(null);
    setStages([]);
  }, []);

  return { state, result, simulation, saveStatus, error, stages, analyze, simulate, reset };
}
