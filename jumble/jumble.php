<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Jumble PHP</title>

        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
    </head>
    <body>

        <div class="container">
            <h2 class="mt-5">Jumble Results</h2>
<?php
    /* A function that validates and posts the results. */
    function post_results($string) {
        $errors = validate_string($string);

        //if there are no errors, show the given string
        if (count($errors) == 0) {
            $string = $string["string"];

            //display given string above
            echo "<h4 class='text-center'>$string</h4>";

            $perms = array();
            generate_perms("", str_split($string), $perms);

            //sort permutations to be in alphabetical order
            sort($perms);

            $valid_perms = spellcheck_perms($perms);

            //display number of perms and number of valid perms
            display_totals(count($perms), count($valid_perms));

            echo "<p class='text-center'>Strings highlighted in green are valid English words, while those highlighted in red are not.</p>";

            //generate and display all possible permutations
            display_perms($perms, $valid_perms);
        }

        //else, show the error messages
        else {
            echo "<h4>Error!</h4>";

            foreach($errors as $error) {
                echo "<p>$error<p>\n";
            }
        }
    }

    /* A function that validates the given string.
     * A valid string has a length greater than one and less than 45 (the longest word in the
     * English language is 45 characters long).
     */
    function validate_string($string) {
        $error = array();

        //make sure the string variable is set
        if (!array_key_exists("string", $string)) {
            array_push($error, "String does not exist");
        }

        if (count($error) == 0) {
            //make sure string is not an empty string
            if (strlen($string["string"]) == 0) {
                array_push($error, "String should not be empty");
            }
            //make sure string only contains alphabetic letters
            else if (preg_match('/[^A-Za-z]+/', $string["string"])) {
                array_push($error, "String should not contain characters besides English letters");
            }
            //make sure string has the right length
            else if (strlen($string["string"]) < 1 || strlen($string["string"]) > 45) {
                array_push($error, "String should be between 1 and 45 characters long");
            }
        }

        return $error;
    }

    /* A function that recursively generates all permuations of the given string. */
    function generate_perms($prefix, $chars, &$perms) {
        //base case
        if (count($chars) == 1) {
            $perms[] = $prefix . array_pop($chars);
        }
        else {
            for ($i = 0; $i < count($chars); $i++) {
                $temp = $chars;
                unset($temp[$i]);

                generate_perms($prefix . $chars[$i], array_values($temp), $perms);
            }
        }
    }

    /* A function that checks if each string in the given array is a valid English word. */
    function spellcheck_perms($perms) {
        $valid_perms = array();
        $pspell_link = pspell_new("en");

        foreach ($perms as $word) {
            if (pspell_check($pspell_link, $word)) {
                array_push($valid_perms, $word);
            }
        }

        return $valid_perms;
    }

    /* A function that displays the total number of permutations and valid permutations in a table */
    function display_totals($num_perms, $num_valid_perms) {
        //do nothing yet
        echo "<div class='row justify-content-center'>
            <table class='table col-md-6 text-center'>
                <tr>
                    <th scope='col'>Total Permutations</th>
                    <th scope='col'>Total Valid Words</th>
                </tr>
                <tr>
                    <td>$num_perms</td>
                    <td>$num_valid_perms</td>
                </tr>
            </table>
        </div>";
    }

    /* A function that displays each permutation of the given string.
     * If a string is a valid English word, it is highlighted in green. If not, it is highlighted
     * in red.
     */
    function display_perms($perms, $valid_perms) {
        echo "<div class='row justify-content-center'>
            <table class='table col-md-3 text-center'>
                <tr>
                    <th class='col'>Permutations</th>
                </tr>";
        //for each perm in the array, add it to the table
        foreach ($perms as $word) {
            //if the perm is a valid word, add bootstrap green class to it
            if (in_array($word, $valid_perms)) {
                echo "<tr>
                    <td class='table-success'>$word</td>
                </tr>";
            }
            //else, add bootstrap red class to it
            else {
                echo "<tr>
                    <td class='table-danger'>$word</td>
                </tr>";
            }
        } 
        echo "</table>
        </div>";
    }

    $string = $_POST;
    post_results($string);
?>

        </div>
    </body>
</html>
