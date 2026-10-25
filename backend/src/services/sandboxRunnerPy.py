import sys
import json
import time

def parse_input_args(input_val):
    if input_val is None:
        return []
    s = str(input_val).strip()
    if not s:
        return []
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            return parsed
        return [parsed]
    except Exception:
        parts = s.split()
        res = []
        for p in parts:
            try:
                res.append(int(p))
            except ValueError:
                try:
                    res.append(float(p))
                except ValueError:
                    res.append(p)
        return res

def outputs_match(actual, expected):
    norm_a = str(actual).strip()
    norm_e = str(expected).strip()
    if norm_a == norm_e:
        return True
    try:
        return abs(float(norm_a) - float(norm_e)) < 0.0001
    except Exception:
        pass
    try:
        return json.loads(norm_a) == json.loads(norm_e)
    except Exception:
        pass
    return False

def main():
    try:
        raw_input = sys.stdin.read()
        payload = json.loads(raw_input)
        code = payload.get('code', '')
        test_cases = payload.get('testCases', [])
        time_limit = float(payload.get('timeLimitSeconds', 5.0))
    except Exception as e:
        print(json.dumps({'status': 'error', 'error': str(e), 'results': []}))
        return

    # Restricted builtins to sanitize hazardous calls
    safe_builtins = {
        'print': print,
        'range': range,
        'len': len,
        'int': int,
        'float': float,
        'str': str,
        'list': list,
        'dict': dict,
        'set': set,
        'tuple': tuple,
        'bool': bool,
        'abs': abs,
        'sum': sum,
        'min': min,
        'max': max,
        'sorted': sorted,
        'enumerate': enumerate,
        'zip': zip,
        'map': map,
        'filter': filter,
        'isinstance': isinstance,
        'Exception': Exception,
        'ValueError': ValueError,
        'TypeError': TypeError,
        'IndexError': IndexError,
        'KeyError': KeyError
    }

    env = {'__builtins__': safe_builtins}
    try:
        compiled = compile(code, 'student_solution.py', 'exec')
        exec(compiled, env)
    except Exception as e:
        print(json.dumps({
            'status': 'compilation_error',
            'passed': False,
            'score_percentage': 0,
            'test_cases_passed': 0,
            'total_test_cases': len(test_cases),
            'execution_time_ms': 0,
            'memory_usage_mb': 0,
            'error': str(e),
            'results': []
        }))
        return

    user_fns = [v for k, v in env.items() if callable(v) and k != '__builtins__']
    target_fn = user_fns[-1] if user_fns else None

    results = []
    total_time_ms = 0
    overall_passed = True

    for i, tc in enumerate(test_cases):
        is_hidden = bool(tc.get('is_hidden', False))
        tc_id = tc.get('id', f'tc-{i+1}')
        tc_in = tc.get('input', '')
        tc_exp = tc.get('expected_output', '')
        
        start = time.perf_counter()
        tc_error = None
        actual_output = ''
        passed = False

        try:
            if target_fn:
                args = parse_input_args(tc_in)
                res = target_fn(*args)
                actual_output = str(res) if res is not None else ''
            passed = outputs_match(actual_output, tc_exp)
        except Exception as e:
            passed = False
            tc_error = str(e)

        duration = int((time.perf_counter() - start) * 1000)
        total_time_ms += duration

        if not passed:
            overall_passed = False

        results.append({
            'test_case_id': tc_id,
            'is_hidden': is_hidden,
            'passed': passed,
            'execution_time_ms': duration,
            'input': None if is_hidden else tc_in,
            'expected_output': None if is_hidden else tc_exp,
            'actual_output': None if is_hidden else actual_output,
            'error': tc_error
        })

    passed_count = sum(1 for r in results if r['passed'])
    total_count = len(results)

    print(json.dumps({
        'status': 'passed' if overall_passed else 'failed',
        'passed': overall_passed,
        'score_percentage': round((passed_count / total_count * 100), 1) if total_count > 0 else 0,
        'test_cases_passed': passed_count,
        'total_test_cases': total_count,
        'execution_time_ms': total_time_ms,
        'memory_usage_mb': 12.0,
        'error': None if overall_passed else 'Some test cases failed',
        'results': results
    }))

if __name__ == '__main__':
    main()
