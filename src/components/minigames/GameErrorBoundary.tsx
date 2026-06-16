import { Component, type ErrorInfo, type ReactNode } from 'react';

// ============================================================================
//  GameErrorBoundary — กันเกมตัวเดียวพังแล้วจอขาวทั้งแอป
//  ถ้าเกมเด้ง error จะโชว์ข้อความ + ชื่อเกม + ปุ่มลองใหม่ แทน
// ============================================================================

interface Props {
  gameName: string;
  onReset?: () => void;
  children: ReactNode;
}
interface State { hasError: boolean; msg: string; }

export default class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, msg: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, msg: err?.message || 'unknown' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[GameError] ${this.props.gameName}:`, err, info);
  }

  reset = () => {
    this.setState({ hasError: false, msg: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card text-center py-8 px-4 border-2 border-danger-200 bg-danger-50">
          <p className="text-3xl mb-2">🛠️</p>
          <p className="font-display font-bold text-danger-700">เกม "{this.props.gameName}" มีปัญหา</p>
          <p className="text-xs text-slate-500 mt-1 break-words">({this.state.msg})</p>
          <button onClick={this.reset} className="btn-primary mt-4 px-6">↩ กลับไปเลือกเกม</button>
        </div>
      );
    }
    return this.props.children;
  }
}
